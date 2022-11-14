import click, shutil, os, requests, json
from pathlib import Path
from ntcore import Client
from ruamel import yaml

FRAMEWORKS = ['sklearn', 'tensorflow', 'pytorch']

@click.group()
def cli():
    pass

@click.command()
@click.option('--server', '-s', default='http://localhost:8000', help='ntcore server endpoint')
@click.option('--workspace-id', '-w', required=True, help='target workspace id')
@click.option('--framework', '-f', default=None, required=True, help='framework to run models, i.e., sklearn, tensorflow, pytorch etc')
@click.option('--model', '-m', default=None, required=True, help='model file path')
def archive_model(server, workspace_id, framework, model):
    '''
    Archive the target python code as serialized file.
    '''
    if framework not in FRAMEWORKS:
        click.echo(click.style("Error", fg="red") + ": Invalid framework, acceptable values are sklearn, tensorflow, pytorch.")
        exit(1)

    api_token = None
    curpath = os.path.dirname(os.path.realpath(__file__))
    yamlpath = os.path.join(curpath, "api_token.yaml")

    try:
        yamlfile = open(yamlpath, "r")
        tokenValue = yaml.load(yamlfile.read(), Loader=yaml.Loader)
        api_token = tokenValue['api_token']
    except Exception as e:
        logging.error("Authentication Failed. Please login first or use option --help for more information") 
        err_message = "Error: " + str(e)

    click.echo(f"Archiving {model} ...")

    client = Client(server=server, api_token=api_token)
    with client.start_run(workspace_id) as exper:
        exper.framework = framework
        click.echo(f"Uploading archived model to NTCore ...")
        exper.save_model(model)



@click.command()
@click.option('--server', '-s', default='http://localhost:8000', help='ntcore server endpoint')
@click.option("--username", '-u', type=str, default=None, required=True, help='username')
@click.password_option()
def login(username, password):
    '''
    Input username and password. 
    '''
    click.echo(f"{username} {password}")


    url = server + '/dsp/api/v1/user/login'
    hearders = {"Content-Type: application/json"}
    data = {
        "email": username,
        "password": password
    }


    response = requests.post(url = url, data = json.dumps(data), hearders = hearders)
    tokenValue = {
        'api_token': response.json()["data"]["api_token"]
    }
    
    curpath = os.path.dirname(os.path.realpath(__file__))
    yamlpath = os.path.join(curpath, "api_token.yaml")
    with open(yamlpath, "w", encoding="utf-8") as f:
        yaml.dump(tokenValue, f, Dumper=yaml.RoundTripDumper)



cli.add_command(archive_model)
cli.add_command(login)


if __name__ == '__main__':
    cli()
