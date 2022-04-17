import React from 'react';
import DashboardIcon from '@material-ui/icons/Dashboard';
import LayersIcon from '@material-ui/icons/Layers';
import InsertChartIcon from '@material-ui/icons/InsertChart';

export const links = [
  { name: 'Workspaces', href: "/dsp/console/workspaces", icon: <LayersIcon />},
  { name: 'Deployments', href: '/dsp/console/deployments', icon: <DashboardIcon />},
  { name: 'Monitoring', href: '/dsp/console/monitoring', icon: <InsertChartIcon />},
  // { name: 'Instances', href: '/dsp/console/instances', icon: <BuildIcon />}
]
