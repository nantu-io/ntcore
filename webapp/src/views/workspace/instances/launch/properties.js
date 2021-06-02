export const useStyles = (theme) => ({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    padding: '10px 20px'
  },
  textField: {
    width: '100%',
  },
  buttonGroup: {
    '& > *': {
      marginTop: theme.spacing(5),
      marginRight: theme.spacing(3),
      marginBottom: theme.spacing(1),
    },
  },
  formControl: {
    marginTop: theme.spacing(1),
    marginRight: theme.spacing(2),
    minWidth: 200,
  },
  runtimeForm: {
    marginRight: theme.spacing(2),
    marginTop: theme.spacing(3),
    minWidth: 420,
  },
  packageForm: {
    marginTop: theme.spacing(5),
    minWidth: 420,
  },
});