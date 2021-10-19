/**
 * @license "Highsoft Dashboard" v@product.version@ (@product.date@)
 * @modules highsoft/dashboard
 * @requires window
 *
 * Highsoft Dashboard
 *
 * License: www.highcharts.com/license
 */

'use strict';

/* *
 *
 *  Imports
 *
 * */

import Dashboard from '../Dashboard/Dashboard.js';
import DashboardGlobals from '../Dashboard/DashboardGlobals.js';
import PluginHandler from '../Dashboard/PluginHandler.js';
import Sync from '../Dashboard/Component/Sync/Sync.js';

/* *
 *
 *  Declarations
 *
 * */

declare global {
    interface Window {
        Dashboard: typeof D;
        Highcharts: typeof Highcharts & { Dashboard: typeof D };
    }
    let Dashboard: typeof D;
}

/* *
 *
 *  Namespace
 *
 * */

const D = {
    ...DashboardGlobals,
    _modules: (typeof _modules === 'undefined' ? {} : _modules),
    Dashboard,
    PluginHandler,
    Sync
};

/* *
 *
 *  Classic Exports
 *
 * */

if (!D.win.Dashboard) {
    D.win.Dashboard = D;
}

export default D;