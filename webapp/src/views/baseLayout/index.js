import React from 'react';
import clsx from 'clsx';
import { makeStyles } from '@material-ui/core/styles';
import { useHistory } from 'react-router-dom';
import CssBaseline from '@material-ui/core/CssBaseline';
import Drawer from '@material-ui/core/Drawer';
import Box from '@material-ui/core/Box';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import List from '@material-ui/core/List';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import Badge from '@material-ui/core/Badge';
import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import Link from '@material-ui/core/Link';
import MenuIcon from '@material-ui/icons/Menu';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import SettingsIcon from '@material-ui/icons/Settings';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';

import { links } from './properties.js';

function Copyright() {
  return (
    <Typography variant="body2" color="textSecondary" align="center">
      {'Copyright © '}
      <Link color="inherit" href="https://nantu.io/">
        nantu.io
      </Link>{' '}
      {new Date().getFullYear()}
      {'.'}
    </Typography>
  );
}

const drawerWidth = 240;

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
  },
  toolbar: {
    paddingRight: 24, // keep right padding when drawer closed
  },
  toolbarIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: '0 8px',
    ...theme.mixins.toolbar,
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  appBarShift: {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  menuButton: {
    marginRight: 36,
  },
  // settingMenuItem: {
  //   '&:focus': {
  //     backgroundColor: theme.palette.primary.main,
  //     '& .MuiListItemIcon-root, & .MuiListItemText-primary': {
  //       color: theme.palette.common.white,
  //     },
  //   },
  // },
  settingMenuItem: {
    paddingLeft: 30,
    paddingRight: 30
  },
  menuButtonHidden: {
    display: 'none',
  },
  title: {
    flexGrow: 1,
  },
  drawerPaper: {
    position: 'relative',
    whiteSpace: 'nowrap',
    width: drawerWidth,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  drawerPaperClose: {
    overflowX: 'hidden',
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    width: theme.spacing(7),
    [theme.breakpoints.up('sm')]: {
      width: theme.spacing(9),
    },
  },
  appBarSpacer: theme.mixins.toolbar,
  content: {
    flexGrow: 1,
    height: '100vh',
    overflow: 'auto',
  },
  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
  paper: {
    padding: theme.spacing(2),
    display: 'flex',
    overflow: 'auto',
    flexDirection: 'column',
  },
  fixedHeight: {
    height: 240,
  },
  copyRight: {
    position: 'fixed',
    bottom: 30,
    left: 25,
    paddingTop: 0,
  }
}));


export default function BaseLayout(props) {
  const classes = useStyles();
  const [open, setOpen] = React.useState(true);
  const [settingMenuAnchor, setSettingMenuAnchor] = React.useState(null);
  const history = useHistory();

  const handleDrawerOpen = () => {
    setOpen(true);
  };
  const handleDrawerClose = () => {
    setOpen(false);
  };

  const mainListItems = (
    links.map((link, index) => {
      return (
        <ListItem button style={index === props.index ? {backgroundColor: '#eeeeee'} : null} onClick={() => history.push(link.href)}>
          <ListItemIcon>
            {link.icon}
          </ListItemIcon>
          <Link color='inherit' href={link.href}>
            <ListItemText primary={link.name} />
          </Link>
        </ListItem>
      )
    })
  )

  const _handleSettingMenuClick = (e) => {
    setSettingMenuAnchor(e.currentTarget);
  }

  const _handleSettingMenuClose = () => {
    setSettingMenuAnchor(null);
  }

  const _handleLogout = () => {
    localStorage.removeItem('dspcolumbus_access_token');
    history.push('/dsp/users/login');
  }

  const _handleLogin = () => {
    history.push('/dsp/users/login');
  }

  const settingMenuItems = (
    <div>
      <MenuItem className={classes.settingMenuItem}>
        <ListItemText primary="Log in" onClick={_handleLogin}/>
      </MenuItem>
      <MenuItem className={classes.settingMenuItem}>
        <ListItemText primary="Log out" onClick={_handleLogout}/>
      </MenuItem>
    </div>
  )

  return (
    <div className={classes.root}>
      <CssBaseline />
      <AppBar position="absolute" className={clsx(classes.appBar, open && classes.appBarShift)}>
        <Toolbar className={classes.toolbar}>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            className={clsx(classes.menuButton, open && classes.menuButtonHidden)}
          >
            <MenuIcon />
          </IconButton>
          <Typography component="h1" variant="h6" color="inherit" noWrap className={classes.title}>
            NTCORE
          </Typography>
          <IconButton color="inherit" onClick={_handleSettingMenuClick}>
            <Badge badgeContent={0} color="secondary">
              <SettingsIcon />
            </Badge>
          </IconButton>
          <Menu
            elevation={1}
            getContentAnchorEl={null}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'center'
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'center'
            }}
            id="setting-menu"
            anchorEl={settingMenuAnchor}
            keepMounted
            open={Boolean(settingMenuAnchor)}
            onClose={_handleSettingMenuClose}
          >
            {settingMenuItems}
          </Menu>
          
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        classes={{
          paper: clsx(classes.drawerPaper, !open && classes.drawerPaperClose),
        }}
        open={open}>
        <div className={classes.toolbarIcon}>
          <IconButton onClick={handleDrawerClose}>
            <ChevronLeftIcon />
          </IconButton>
        </div>
        <Divider />
        <List>

        </List>
        {mainListItems}
        <Box className={classes.copyRight} pt={85}>
          <Copyright />
        </Box>
      </Drawer>
      <main className={classes.content}>
        <div className={classes.appBarSpacer} />
        <Container maxWidth="lg" className={classes.container}>
          <Grid container spacing={3}>
            {props.children}
          </Grid>
        </Container>
      </main>
    </div>
  );
}