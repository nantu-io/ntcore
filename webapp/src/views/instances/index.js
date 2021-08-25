import React from 'react';
import BaseLayout from '../baseLayout';
import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import Grid from '@material-ui/core/Grid';
import Chip from '@material-ui/core/Chip';
import { withStyles } from '@material-ui/core/styles';
import PulseLoader from 'react-spinners/PulseLoader';
import Typography from '@material-ui/core/Typography';
import Container from '@material-ui/core/Container';
import JupyterLabel from '../../assets/images/jupyter-notebook.png';
import TheiaPython from '../../assets/images/python.png';
import { waitUntil } from 'async-wait-until';
import { instanceTypeDisplay, instanceDescriptions as descriptions, ServiceType, ServiceState } from '../constants';
import BaseModal from '../baseModal';
import LaunchForm from './launch';
import StopForm from './stop';
import { fetchDataV1 } from '../../global';

const useStyles = (theme) => ({
  icon: {
    marginRight: theme.spacing(2),
  },
  heroContent: {
    backgroundColor: theme.palette.background.paper,
    padding: theme.spacing(8, 0, 6),
  },
  heroButtons: {
    marginTop: theme.spacing(4),
  },
  cardGrid: {
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(2),
  },
  card: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  cardMedia: {
    paddingTop: '56.25%', // 16:9
    backgroundRepeat: 'no-repeat',
    backgroundSize: '100% auto',
  },
  cardContent: {
    flexGrow: 1,
  },
  cardActions: {
    display: "flex",
    justifyContent: "start"
  },
  statusChip: {
    width: "40%",
    marginLeft: 10,
    height: 26
  },
  pulseLoader: {
    
  },
  footer: {
    backgroundColor: theme.palette.background.paper,
    padding: theme.spacing(6),
  },
});
const SERVICE_LABEL = {
  [ServiceType.THEIA_PYTHON]: TheiaPython,
  [ServiceType.JUPYTER]: JupyterLabel,
}
const SERVICE_DESCRIPTION = {
  [ServiceType.THEIA_PYTHON]: descriptions.THEIA_PYTHON,
  [ServiceType.JUPYTER]: descriptions.JUPYTER_NOTEBOOK
}
const STATE_STYLE = {
  [ServiceState.RUNNING]: {bgColor: '#00e676' ,color: 'white' },
  [ServiceState.PENDING]: {bgColor: "#fb8c00", color: "white" },
  [ServiceState.UNKNOWN]: {bgColor: "#fb8c00", color: "white" },
  [ServiceState.STOPPED]: {bgColor: "", color: "" },
  [ServiceState.INACTIVE]: {bgColor: "", color: "" },
  [ServiceState.STOPPING]:{bgColor: "#ff1744", color: "white" },
}

const MODAL_MODE = { LAUNCH: "LAUNCH", STOP: "STOP" };

class Instances extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      isModalOpen: false,
      launchInfo: { type: null, index: -1 },
      stopInfo: { type: null, name: null, index: -1 },
      mode: null
    }
    this._onComplete = this._onComplete.bind(this);
    this._updateInstanceStates = this._updateInstanceStates.bind(this);
    this._waitUtilAllInstancesResolved = this._waitUtilAllInstancesResolved.bind(this);
  }

  componentDidMount() {
    this.setState({instances: this._createDefaultInstances()}, this._waitUtilAllInstancesResolved);
  }

  _createDefaultInstances() {
    return this._createInstances([ServiceType.JUPYTER, ServiceType.THEIA_PYTHON]);
  }

  _createInstances(types) {
    return types.map(type => this._createInstance(type));
  }

  _createInstance(type) {
    return { type, state: ServiceState.INACTIVE, description: SERVICE_DESCRIPTION[type], image: SERVICE_LABEL[type] };
  }

  _closeModal = () => {
    this.setState({ isModalOpen: false, mode: null });
  }

  _openModal = (mode) => {
    this.setState({ isModalOpen: true, mode: mode })
  }

  _onOpenClick = (type, name) => {
    var link;
    switch (type) {
      case ServiceType.THEIA_PYTHON: link = `/i/${name}/#/home/project`; break;
      case ServiceType.JUPYTER: link = `/i/${name}`; break;
      default: link = `/i/${name}`; break;
    }
    window.open(link, '_blank')
  }

  _onComplete() {
    this.setState({ isModalOpen: false }, this._waitUtilAllInstancesResolved);
  }

  _onLaunchClick(type, name) {
    this.setState({ launchInfo: { type, name } }, () => this._openModal(MODAL_MODE.LAUNCH));
  }

  _onStopClick(type, name) {
    this.setState({ stopInfo: { type, name } }, () => this._openModal(MODAL_MODE.STOP));
  }

  async _updateInstanceStates() {
    const newInstances = (await fetchDataV1('/dsp/api/v1/services')).data;
    return await new Promise((resolve) => this._setInstances(newInstances, () => resolve(this._everyInstanceResolved())));
  }

  _everyInstanceResolved() {
    return this.state.instances.every(s => ![ServiceState.PENDING, ServiceState.STOPPING].includes(s.state));
  }

  _setInstances(newInstances, callback) {
    const { instances } = this.state;
    if (!newInstances) return; 
    const instanceMap = newInstances.reduce((res, s) => 
      { res[s.type] = { name: s.name, state: s.state }; return res;}, {});
    const instancesCopy = instances.map(instance => { return (instanceMap[instance.type]) ? 
      { ...instance, ...instanceMap[instance.type] } : { ...instance, state: ServiceState.INACTIVE }; 
    });
    this.setState({instances: instancesCopy}, callback);
  }

  async _waitUtilAllInstancesResolved() {
    await waitUntil(this._updateInstanceStates, { timeout: 300000, intervalBetweenAttempts: 10000 });
  }

  _renderStatus(currentState) {
    const bgColor = STATE_STYLE[currentState].bgColor;
    const color = STATE_STYLE[currentState].color;
    if (currentState === ServiceState.UNKNOWN) {
      return <PulseLoader className={this.props.classes.pulseLoader} size={10} color="gray" loading={true} />;
    }
    return <Chip className={this.props.classes.statusChip} style={{ backgroundColor: bgColor, color: color }} label={currentState}/>
  }

  _renderActiveForm() {
    const { mode, launchInfo, stopInfo } = this.state;
    switch(mode) {
      case MODAL_MODE.LAUNCH: return <LaunchForm type={launchInfo.type} name={launchInfo.name} onComplete={this._onComplete}/>;
      case MODAL_MODE.STOP: return <StopForm name={stopInfo.name} type={stopInfo.type} onComplete={this._onComplete}/>;
      default: return null;
    }
  }

  render() {
    const { classes } = this.props;
    const { instances } = this.state;
    const activeForm = this._renderActiveForm();

    return (
      <React.Fragment>
        <BaseLayout index={2}>
          <Container className={classes.cardGrid} maxWidth={false}>
            <Grid container spacing={4}>
              {instances && instances.map((instance, index) => (
                <Grid item key={`${instance}-${index}`} xs={12} sm={6} md={4} lg={3}>
                  <Card className={classes.card}>
                    <CardMedia
                      className={classes.cardMedia}
                      image={instance.image}
                      title={instance.type}
                    />
                    <CardContent className={classes.cardContent}>
                      <Typography gutterBottom variant="h5" component="h2">
                        {instanceTypeDisplay[instance.type]}
                      </Typography>
                      <Typography>
                        {instance.description}
                      </Typography>
                    </CardContent>
                    <CardActions className={classes.cardActions}>
                      <Button size="small" disabled={instance.state !== ServiceState.RUNNING} color="primary" onClick={() => this._onOpenClick(instance.type, instance.name)}>
                        Open
                      </Button>
                      {instance.state === ServiceState.RUNNING || instance.state === ServiceState.STOPPING ? 
                        <Button size="small" color="primary" disabled={instance.state !== ServiceState.RUNNING} onClick={() => this._onStopClick(instance.type, instance.name)}>
                          Stop
                        </Button>
                          :
                        <Button size="small" color="primary" disabled={instance.state !== ServiceState.STOPPED && instance.state !== ServiceState.INACTIVE} onClick={() => this._onLaunchClick(instance.type, instance.name)}>
                          Launch
                        </Button>
                      }
                      {this._renderStatus(instance.state)}
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Container>
          <BaseModal 
            open={this.state.isModalOpen}
            onCancel={this._closeModal}>
            {activeForm}
          </BaseModal>
        </BaseLayout>
      </React.Fragment>
    );
  }
}

export default withStyles(useStyles)(Instances);