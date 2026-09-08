'use strict';

const Homey = require('homey');

module.exports = class SunsaApp extends Homey.App {

  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    this.log('Sunsa app has been initialized');
  }

};
