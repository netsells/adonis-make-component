'use strict';

const { Command } = require('@adonisjs/ace');

const kebabCase = require('lodash.kebabcase');
const camelCase = require('lodash.camelcase');
const template = require('lodash.template');
const { existsSync, mkdirSync, readFileSync, writeFileSync } = require('fs');
const { resolve } = require('path');

/**
 * Available prop types and their corresponding default values.
 *
 * @type {{Array: {component: string, arg: string}, Function: {component: string, arg: string}, Number: {component: string, arg: string}, Object: {component: string, arg: string}, String: {component: string, arg: string}, Boolean: {component: string, arg: string}}}
 */
const propTypes = {
    String: {
        component: '\'\'',
        arg: '\'\'',
    },
    Number: {
        component: 'null',
        arg: '1',
    },
    Boolean: {
        component: 'false',
        arg: 'false',
    },
    Object: {
        component: '() => ({})',
        arg: '{}',
    },
    Array: {
        component: '() => ([])',
        arg: '[]',
    },
    Function: {
        component: '() => {}',
        arg: '() => {}',
    },
};

class MakeComponent extends Command {
    /**
     * Return the command and arguments.
     *
     * @returns {string}
     */
    static get signature() {
        return `
            make:component
            { path : Path to create the component }
        `;
    }

    /**
     * Return the command description.
     *
     * @returns {string}
     */
    static get description() {
        return 'Scaffold a vue component with test and story files';
    }

    /**
     * Execute the command logic.
     *
     * @param {object} args
     *
     * @returns {void}
     */
    async handle(args) {
        try {
            this.path = args.path;
            this.props = [];

            const [componentName] = this.path.split('/').reverse();

            if (existsSync(resolve(this.path, `${ componentName }.vue`))) {
                this.error(`${ componentName } already exists at [${ this.path }].`);
                process.exit(0);
            }

            await this.askProps();
            await this.confirmConfig();
            this.setConfig(componentName);
            this.generateTemplates();

            this.success(`${ componentName } scaffolding created successfully at [${ this.path }].`);

            process.exit(1);
        } catch (e) {
            this.error(e);
        }
    }

    /**
     * Set the stub config data.
     *
     * @param {object} componentName
     */
    setConfig(componentName) {
        this.config = {
            pascalName: componentName,
            camelName: camelCase(componentName),
            kebabName: kebabCase(componentName),
            toRoot: '../'.repeat(this.path.split('/').length),
            props: this.props,
        };
    }

    /**
     * Generate the component templates from their stubs.
     */
    generateTemplates() {
        const outputDirectory = this.ensureDirectory();

        [
            'Component.vue.stub',
            'Component.spec.js.stub',
            'Component.stories.js.stub',
        ].forEach((stub) => {
            const stubTemplate = template(this.loadStub(stub))(this.config);

            const filename = stub
                .replace('Component', this.config.pascalName)
                .replace('.stub', '');

            writeFileSync(`${ outputDirectory }/${ filename }`, stubTemplate);
        });
    }

    /**
     * Ensure the directory for the component exists, else
     * recursively create and return it.
     *
     * @returns {string}
     */
    ensureDirectory() {
        return this.path.split('/').reduce((fullPath, directory) => {
            const path = resolve(fullPath, directory);

            if (!existsSync(path)) {
                mkdirSync(path);
            }

            return path;
        }, process.cwd());
    }

    /**
     * Ask for the prop name, with validation.
     *
     * @returns {Promise<string>}
     */
    async askPropName() {
        let name;

        while (!name) {
            name = await this.ask('Name');
            if (!name) {
                this.error('Please provide a name');
            } else if (name !== camelCase(name)) {
                this.error('Name must be camelcase');
                name = undefined;
            } else if (this.props.find((prop) => prop.name === name)) {
                this.error('Prop already defined');
                name = undefined;
            }
        }

        return name;
    }

    /**
     * Ask for the prop types, with validation.
     *
     * @returns {Promise<[]>}
     */
    async askPropTypes() {
        let types = [];

        while (!types.length) {
            types = await this.multiple('Select type(s)', Object.keys(propTypes));

            if (!types.length) {
                this.error('Please select one or more types');
            }
        }

        return types;
    }

    /**
     * Ask the user to input props.
     *
     * @returns {Promise<void>}
     */
    async askProps() {
        let propsQuestion = await this.confirm('Would you like to define props?');

        while (propsQuestion) {
            this.info('');
            const name = await this.askPropName();
            const types = await this.askPropTypes();

            const { component, arg } = propTypes[types[0]];

            this.props.push({
                name,
                types,
                propValue: component,
                argValue: arg,
            });

            propsQuestion = await this.confirm('Would you like to define another?');
        }
    }

    /**
     * Load a template stub.
     *
     * @param {string} path
     *
     * @returns {string}
     */
    loadStub(path) {
        return readFileSync(resolve(__dirname, `stubs/MakeComponent/${ path }`), 'utf-8');
    }

    /**
     * Prompt the user to confirm the current config.
     *
     * @returns {Promise<void>}
     */
    async confirmConfig() {
        this.info(`Scaffolding component at: ${ this.path }`);

        if (this.props.length) {
            this.info('Props:');

            this.props.forEach(({ name, types }) => {
                this.info(`${ name }: [${ types.join(', ') }]`);
            });
        }

        if (!(await this.confirm('Is this correct?'))) {
            process.exit(0);
        }
    }
}

module.exports = MakeComponent;
