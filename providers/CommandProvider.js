'use strict';

const { ServiceProvider } = require.main.require('@adonisjs/fold');

class CommandProvider extends ServiceProvider {
    /**
     * Register command bindings.
     */
    register() {
        this.app.bind('Adonis/Commands/Make:Component', () => require('../src/Commands/MakeComponent'));
        this.app.bind('Adonis/Commands/Make:PageComponent', () => require('../src/Commands/MakePageComponent'));
    }

    /**
     * Add commands to Ace.
     */
    boot() {
        const ace = require('@adonisjs/ace');

        ace.addCommand('Adonis/Commands/Make:Component');
        ace.addCommand('Adonis/Commands/Make:PageComponent');
    }
}

module.exports = CommandProvider;
