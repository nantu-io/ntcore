export const useStyles = (theme) => ({
  root: {
    width: '100%',
  },
  button: {
    marginRight: theme.spacing(1),
  },
  instructions: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  stepper: {
    backgroundColor: 'transparent',
  },
  buttonGroup: {
    '& > *': {
      marginTop: '150px',
      marginBottom: theme.spacing(2),
    },
    float: 'right'
  },
});

export const STEPS = {
  0: 'Development',
  1: 'Experiments',
  2: 'Deployments'
}

export const SEVERITY = {
  INFO: 'info',
  ERROR: 'error',
  SUCCESS: 'success',
  WARNING: 'warning'
}

export const OPTIONAL_STEPS = new Set([]);
