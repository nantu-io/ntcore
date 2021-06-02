export const useStyles = (theme) => ({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    padding: '10px 20px'
  },
  textField: {
    width: '100%',
  },
  formControl: {
    width: '100%',
    margin: '20px 0',
  },
  buttonGroup: {
    '& > *': {
      marginTop: theme.spacing(3),
      marginRight: theme.spacing(2),
      marginBottom: theme.spacing(1),
    },
  },
});