import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Modal from '@material-ui/core/Modal';

const useStyles = makeStyles((theme) => ({
  modal: {
    display: 'flex',
    padding: theme.spacing(1),
    alignItems: 'center',
    justifyContent: 'center',
  },
  paper: {
    width: 510,
    backgroundColor: theme.palette.background.paper,
    border: '1px solid #000',
    boxShadow: theme.shadows[5],
    padding: theme.spacing(2, 2, 2),
  },
  buttonGroup: {
    '& > *': {
      marginTop: theme.spacing(3),
      marginRight: theme.spacing(2),
      marginBottom: theme.spacing(1),
    },
  },
}));

export default function BaseModal(props) {
  const classes = useStyles();
  const rootRef = React.useRef(null);

  return (
    <Modal
      disablePortal
      disableEnforceFocus
      disableAutoFocus
      open={props.open}
      aria-labelledby={props.label}
      aria-describedby={props.description}
      className={classes.modal}
      container={() => rootRef.current}
    >
      <div className={classes.paper}>
        {props.children ? React.cloneElement(props.children, { onCancel: props.onCancel }) : null}
      </div>
    </Modal>
  );
}
