'use strict';

const { Command } = require('@adonisjs/ace');

const kebabCase = require('lodash.kebabcase');
const camelCase = require('lodash.camelcase');
const template = require('lodash.template');
const { existsSync, mkdirSync, readFileSync, writeFileSync } = require('fs');
const { resolve } = require('path');

class MakePageComponent extends Command {
    /**
     * Return the command and arguments.
     *
     * @returns {string}
     */
    static get signature() {
        return `
            make:page-component
            { path : Path to create the component }
        `;
    }

    /**
     * Return the command description.
     *
     * @returns {string}
     */
    static get description() {
        return 'Scaffold a vue page component with test and story files';
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

            const [componentName] = this.path.split('/').reverse();

            if (existsSync(resolve(this.path, `${ componentName }.vue`))) {
                this.error(`${ componentName } already exists at [${ this.path }].`);
                process.exit(0);
            }

            await this.askAsync();
            await this.confirmConfig();
            this.setConfig(componentName);
            this.generateTemplates();

            this.success(`${ componentName } scaffolding created successfully at [${ this.path }].`);
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
            asyncData: this.asyncData,
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
     * Load a template stub.
     *
     * @param {string} path
     *
     * @returns {string}
     */
    loadStub(path) {
        return readFileSync(resolve(__dirname, `stubs/MakePageComponent/${ path }`), 'utf-8');
    }

    async askAsync() {
        this.asyncData = await this.confirm('Mock asyncData?')
    }

    /**
     * Prompt the user to confirm the current config.
     *
     * @returns {Promise<void>}
     */
    async confirmConfig() {
        this.info(`Scaffolding component at: ${ this.path }`);
        this.info(`Mock asyncData: ${ this.asyncData }`);

        if (!(await this.confirm('Is this correct?'))) {
            process.exit(0);
        }
    }
}

module.exports = MakePageComponent;
