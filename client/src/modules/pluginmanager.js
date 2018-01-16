/**
 * BetterDiscord Plugin Manager
 * Copyright (c) 2015-present JsSucks - https://github.com/JsSucks
 * All rights reserved.
 * https://github.com/JsSucks - https://betterdiscord.net
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree. 
*/

const { Module } = require('./modulebase');
const { BDIpc } = require('./bdipc');
const { Utils, FileUtils } = require('./utils');
const fs = window.require('fs');
const path = window.require('path');


class Plugin {

    constructor(args) {
        
    }

    start() {
        if (this.onStart) return this.onStart();
        return true; //Assume plugin started since it doesn't have onStart
    }

    stop() {
        if (this.onStop) return this.onStop();
        return true; //Assume plugin stopped since it doesn't have onStop
    }

}

class PluginManager extends Module {
    
    setInitialState() {
        window.pm = this;
        this.setState({
            plugins: []
        });
        tests();
    }

    get plugins() {
        return this.state.plugins;
    }

    async loadPlugin(pluginPath) {
        const { plugins } = this.state;

        try {

            const loaded = plugins.find(plugin => plugin.pluginPath === pluginPath);
            if (loaded) {
                throw { 'message': 'Attempted to load an already loaded plugin' };
            }

            const readConfig = await this.readConfig(pluginPath);
            const mainPath = path.join(pluginPath, readConfig.main);

            const plugin = window.require(mainPath)(Plugin, {}, {});
            const instance = new plugin();

            plugins.push(Object.assign({
                pluginPath,
                instance
            },readConfig));

            this.setState(plugins);

            return instance;
        } catch (err) {
            throw err;
        }
    }

    async reloadPlugin(pluginPath) {
        //TODO Cleanup loaded plugin
        return await this.loadPlugin(pluginPath);
    }

    getPluginByName(name) { return this.plugins.find(plugin => plugin.name === name); }
    getPluginById(id) { return this.plugins.find(plugin => plugin.id === id); }

    stopPlugin(name) {
        const plugin = this.getPluginByName(name);
        if (plugin && plugin.instance) return plugin.instance.stop();
        return true; //Return true anyways since plugin doesn't exist
    }

    startPlugin(name) {
        const plugin = this.getPluginByName(name);
        if (plugin && plugin.instance) return plugin.instance.start();
        return true; //Return true anyways since plugin doesn't exist
    }

    async readConfig(path) {
        path = `${path}/config.json`;
        return FileUtils.readJsonFromFile(path);
    }

}

const _instance = new PluginManager();

async function tests() {

    const pluginName = 'Example';
    const config = await BDIpc.send('getConfig');
    const pluginPath = config.paths.find(path => 'plugins' in path).plugins;
    try {
        //Load test plugin
        const plugin = await _instance.loadPlugin(path.join(pluginPath, pluginName));
        //Attempt to load the same plugin again
        const plugin2 = await _instance.loadPlugin(path.join(pluginPath, pluginName));
    } catch (err) {
        console.log(`Failed to load plugin! ${err.message}`);
    }
}

module.exports = { PluginManager: _instance }