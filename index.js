'use strict';
const fs        = require('fs');
const axios = require('axios');
const crypto = require('crypto');

const DeployPluginBase = require('ember-cli-deploy-plugin');

module.exports = {
  name: 'ember-cli-deploy-plants',

  createDeployPlugin: function(options) {

    const DeployPlugin = DeployPluginBase.extend({
      name: options.name,

      upload: async function(context) {
        if(context.config.plants) {
          const settings = context.config.plants;
          const filePath = context.distDir + '/index.html';
          const swFilePath = context.distDir + '/sw.js';

          const html = fs.readFileSync(filePath, 'utf8');
          const sw = fs.readFileSync(swFilePath, 'utf8');
          const jsonData = {
            branch: 'master',
            environment: settings.environment,
            published:  true,
            template: html,
            sw_content: sw
          };

          const data = Buffer.from(JSON.stringify(jsonData)).toString('base64');
          const signature = crypto.createHmac('sha256', settings.secretKey)
            .update(data).digest("hex");

            const body = {
              deployment_info: {
                data: data,
                user_id: settings.uid,
                signature: signature
              }
            };

          await axios.post(`${settings.endpoint}/api/admin/v1/deploy`, body)
          .catch((error) => {
            console.error(error.response.data);
          });
          await axios.post(`${settings.endpoint}/api/admin/v1/reset-deploy`, body)
          .catch((error) => {
            console.error(error.response.data);
          });
        }
      }

    });

    return new DeployPlugin();
  }
};