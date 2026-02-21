'use strict';

const Homey = require('homey');
const axios = require('axios');

module.exports = class MyDevice extends Homey.Device {

  /**
   * onInit is called when the device is initialized.
   */
  async onInit() {
    this.log('MyDevice has been initialized');
    this.registerCapabilityListener('windowcoverings_tilt_set', async (value) => {
      this.log('Setting tilt to', value);
      const key = this.homey.settings.get('key');
      const user = this.homey.settings.get('user');
      const deviceId = this.getData().id;
      try {
        await axios.put(`https://sunsahomes.com/api/public/${user}/devices/${deviceId}?publicApiKey=${key}`, {
          Position: value*100,
        }, {});
        this.log('Tilt set successfully');
      } catch (error) {
        this.error('Error setting tilt:', error);
      }
    });
  }

  /**
   * onAdded is called when the user adds the device, called just after pairing.
   */
  async onAdded() {
    this.log('MyDevice has been added');
  }

  /**
   * onSettings is called when the user updates the device's settings.
   * @param {object} event the onSettings event data
   * @param {object} event.oldSettings The old settings object
   * @param {object} event.newSettings The new settings object
   * @param {string[]} event.changedKeys An array of keys changed since the previous version
   * @returns {Promise<string|void>} return a custom message that will be displayed
   */
  async onSettings({ oldSettings, newSettings, changedKeys }) {
    this.log('MyDevice settings where changed');
  }

  /**
   * onRenamed is called when the user updates the device's name.
   * This method can be used this to synchronise the name to the device.
   * @param {string} name The new name
   */
  async onRenamed(name) {
    this.log('MyDevice was renamed');
  }

  /**
   * onDeleted is called when the user deleted the device.
   */
  async onDeleted() {
    this.log('MyDevice has been deleted');
  }

};
