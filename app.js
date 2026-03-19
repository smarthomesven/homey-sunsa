'use strict';

const Homey = require('homey');

module.exports = class SunsaApp extends Homey.App {

  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    this.log('SunsaApp has been initialized');
  }

};
