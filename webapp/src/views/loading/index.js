import React from 'react';
import MoonLoader from 'react-spinners/MoonLoader';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  root: {
    zIndex: '999',
    position: 'absolute',
    left: 0,
    top: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    background: 'cover',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    display: 'flex',
    justifyContent: 'center',
  },
  loader: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)'
  }
}));

export default function Loading(props) {
  const classes = useStyles();

  return (
    props.loading ?
    <div className={classes.root}>
      <div className={classes.loader}>
        <MoonLoader 
          size={50}
          loading={props.loading}
          className={classes.loader}
        />
      </div>
    </div>
    :
    <></>
  );
}