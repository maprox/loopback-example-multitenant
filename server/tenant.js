"use strict";

exports = module.exports = function tenant(app) {

    /**
     * List of tenant datasources
     */
    let tenantDatasources = {};

    /**
     * Returns tenant configuration by its name
     *
     * @param {String} tenant
     * @returns {Object}
     */
    let getTenantDatasources = function (tenant) {
        return tenantDatasources[tenant];
    };

    app.use('/:tenant/', function (req, res, next) {
        let tenantName = req.params.tenant;
        let tenantConfig = getTenantDatasources(tenantName);
        if (tenantConfig) {
            Object.keys(tenantConfig).forEach(function(dataSource) {
                let ds = app.dataSources[dataSource];

                ds.adapter.settings = tenantConfig[dataSource];
                ds.adapter.clientConfig = tenantConfig[dataSource];
                ds.settings = tenantConfig[dataSource];

                app.connector.settings = tenantConfig[dataSource];
                app.connector.clientConfig = tenantConfig[dataSource];
            });

            next();
        } else {
            // Invalid tenant (not found)
            res.json({
                'error': {
                    'name': 'Error',
                    'status': 404,
                    'message': 'Invalid tenant',
                    'statusCode': 404,
                    'stack': 'https://www.npmjs.com/package/loopback-tenant'
                }
            });
        }
    });

    /**
     * Function which updates tenant datasources list
     */
    let updateDatasources = function () {
        let tenant = app.models.Tenant;
        if (tenant && tenant.find) {
            tenant.find({}, function (err, tenants) {
                tenants.map((tenant) => {
                    tenantDatasources[tenant.name] = JSON.parse(tenant.config);
                });
            })
        } else {
            console.log('Error accessing Tenant model!');
        }
    };

    updateDatasources();

    const UPDATE_INTERVAL = 10 * 1000; // 10 seconds
    setInterval(updateDatasources, UPDATE_INTERVAL);

};
