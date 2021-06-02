import React from 'react';
import DashboardIcon from '@material-ui/icons/Dashboard';
import LayersIcon from '@material-ui/icons/Layers';

export const links = [
  { name: 'Workspaces', href: "/dsp/console/workspaces", icon: <LayersIcon />},
  { name: 'Deployments', href: '/dsp/console/applications', icon: <DashboardIcon />}
]
