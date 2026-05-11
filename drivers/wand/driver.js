'use strict';

const Homey = require('homey');
const axios = require('axios');

module.exports = class MyDriver extends Homey.Driver {

  /**
   * onInit is called when the driver is initialized.
   */
  async onInit() {
    this.log('MyDriver has been initialized');
    this.homey.setInterval(() => this.pollSunsaDevices(), 5 * 60 * 1000);
    await this.pollSunsaDevices();
  }

  async onPair(session) {
    this.log('Pairing started');
    session.setHandler("showView", async (viewId) => {
      if (viewId === 'apikey') {
        const key = this.homey.settings.get('key');
        const user = this.homey.settings.get('user');
        if (key && user) {
          try {
            const response = await axios.get(`https://sunsahomes.com/api/public/${user}/devices?publicApiKey=${key}`);
            this.log('API response:', response.data);
            if (response.status === 200) {
              await session.showView('list_devices');
            }
          } catch (error) {
            this.error('Error validating API key:', error);
          }
        }
      }
    });
    session.setHandler('apikey', async (data) => {
      this.log('Received API key:', data.apikey);
      const key = data.apikey;
      const user = data.user;
      if (!key || !user) {
        this.error('API key or user ID is missing');
        return {
          success: false,
          error: 'API key or user ID is missing',
        };
      }
      try {
        const response = await axios.get(`https://sunsahomes.com/api/public/${user}/devices?publicApiKey=${key}`);
        this.log('API response:', response.data);
        if (response.status === 200) {
          this.homey.settings.set('key', key);
          this.homey.settings.set('user', user);
          await session.showView('list_devices');
          return {
            success: true,
          };
        } else {
          return {
            success: false,
            error: 'Something went wrong',
          };
        }
      } catch (error) {
        if (error.response?.status === 401) {
          this.error('Invalid API key');
          return {
            success: false,
            error: 'Invalid API key',
          };
        } else if (error.response?.status === 404) {
          this.error('User not found');
          return {
            success: false,
            error: 'User not found',
          };
        } else if (error.response?.status === 400) {
          this.error('Bad request:', error.response.data);
          return {
            success: false,
            error: 'Invalid user ID format',
          };
        }
        this.error('Error validating API key:', error);
        return {
          success: false,
          error: 'Something went wrong',
        };
      }
    });
    session.setHandler('list_devices', async () => {
      return await this.onPairListDevices();
    });
  }

  async onRepair(session) {
    session.setHandler('apikey', async (data) => {
      this.log('Received API key:', data.apikey);
      const key = data.apikey;
      const user = data.user;
      if (!key || !user) {
        this.error('API key or user ID is missing');
        return {
          success: false,
          error: 'API key or user ID is missing',
        };
      }
      try {
        const response = await axios.get(`https://sunsahomes.com/api/public/${user}/devices?publicApiKey=${key}`);
        this.log('API response:', response.data);
        if (response.status === 200) {
          this.homey.settings.set('key', key);
          this.homey.settings.set('user', user);
          await session.done();
          return {
            success: true,
          };
        } else {
          return {
            success: false,
            error: 'Something went wrong',
          };
        }
      } catch (error) {
        if (error.response?.status === 401) {
          this.error('Invalid API key');
          return {
            success: false,
            error: 'Invalid API key',
          };
        } else if (error.response?.status === 404) {
          this.error('User not found');
          return {
            success: false,
            error: 'User not found',
          };
        } else if (error.response?.status === 400) {
          this.error('Bad request:', error.response.data);
          return {
            success: false,
            error: 'Invalid user ID format',
          };
        }
        this.error('Error validating API key:', error);
        return {
          success: false,
          error: 'Something went wrong',
        };
      }
    });
  }

  /**
   * onPairListDevices is called when a user is adding a device
   * and the 'list_devices' view is called.
   * This should return an array with the data of devices that are available for pairing.
   */
  async onPairListDevices() {
    this.log('Listing devices for pairing');
    const key = this.homey.settings.get('key');
    const user = this.homey.settings.get('user');
    if (!key || !user) {
      this.error('API key or user ID is missing');
      return [];
    }
    try {
      const response = await axios.get(`https://sunsahomes.com/api/public/${user}/devices?publicApiKey=${key}`);
      this.log('API response:', response.data);
      if (response.status === 200) {
        return response.data.devices.map(device => ({
          name: device.Name,
          data: {
            id: device.idDevice,
          },
        }));
      } else {
        this.error('Something went wrong while fetching devices');
        return [];
      }
    } catch (error) {
      this.error('Error fetching devices:', error);
      return [];
    }
  }

  async pollSunsaDevices() {
    this.log('Polling devices');
    const key = this.homey.settings.get('key');
    const user = this.homey.settings.get('user');
    if (!key || !user) {
      this.error('API key or user ID is missing');
      return;
    }
    try {
      const response = await axios.get(`https://sunsahomes.com/api/public/${user}/devices?publicApiKey=${key}`);
      this.log('API response:', response.data);
      if (response.status === 200) {
        const devices = response.data.devices;
        for (const device of devices) {
          const homeyDevice = this.getDevice({ id: device.idDevice });
          if (homeyDevice) {
            await homeyDevice.setAvailable();
            if (device.Position !== undefined) {
              await homeyDevice.setCapabilityValue('windowcoverings_tilt_set', device.Position / 100);
            }
          }
        }
      } else {
        this.error('Something went wrong while fetching devices');
        const devices = this.getDevices();
        for (const id in devices) {
          const homeyDevice = devices[id];
          await homeyDevice.setUnavailable(this.homey.__('errors.unexpected'));
        }
      }
    } catch (error) {
      this.error('Error fetching devices:', error);
      const devices = this.getDevices();
      if (error.response?.status === 401) {
        this.error('Invalid API key');
        for (const id in devices) {
          const homeyDevice = devices[id];
          await homeyDevice.setUnavailable(this.homey.__('errors.invalidkey'));
        }
      } else {
        for (const id in devices) {
          const homeyDevice = devices[id];
          await homeyDevice.setUnavailable(this.homey.__('errors.unexpected'));
        }
      }
    }
  }

};
