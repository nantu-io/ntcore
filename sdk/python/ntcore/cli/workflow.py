import click, os, requests, json
from ntcore import Client
from ruamel import yaml
from pathlib import Path
from ..models.framework import Framework


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
    try:
        _framework = Framework[framework]
    except Exception:
        click.echo(click.style("Error", fg="red") + ": Unknown framework {0}".format(framework))
        exit(1)

    yamlpath = os.path.join(str(Path.home()), ".ntcore", "access_token.yaml")
    try:
        yamlfile = open(yamlpath, "r")
        tokenValue = yaml.load(yamlfile.read(), Loader=yaml.Loader)
        api_token = tokenValue['token']
    except Exception:
        click.echo(click.style("Error", fg="red") + ": Authentication Failed. Please login first or use option --help for more information.")
        exit(1)

    click.echo(f"Archiving {model} ...")

    client = Client(server=server, api_token=api_token)
    with client.start_run(workspace_id) as exper:
        exper.framework = _framework
        click.echo(f"Uploading archived model to NTCore ...")
        exper.save_model(model)


@click.command()
@click.option('--server', '-s', default='http://localhost:8000', help='ntcore server endpoint')
@click.option("--username", '-u', type=str, default=None, required=True, help='username')
@click.password_option(confirmation_prompt=False)
def login(username, password, server):
    '''
    Input username and password. 
    '''
    url = server + '/dsp/api/v1/users/login'
    headers = {"Content-Type": "application/json"}
    data = {
        "email": username,
        "password": password
    }

    try:
        response = requests.post(url = url, data = json.dumps(data), headers = headers)
    except Exception as e:
        # The request failed to connect
        raise Exception('Connection to {} failed: {}'.format(url, e.args[0]))

    if response.status_code == 204:
        return {}
    content = response.content
    if hasattr(content, 'decode'):  # Python 2
        content = content.decode('utf-8')

    try:
        json_body = json.loads(content)
    except Exception as e:
        raise Exception('Invalid response: {}'.format(e))
    if 'errors' in json_body or 'error' in json_body:
        raise Exception(json_body)

    token_value = json_body
    ntcore_home = os.path.join(str(Path.home()), ".ntcore")
    os.makedirs(ntcore_home, exist_ok=True)
    yamlpath = os.path.join(ntcore_home, "access_token.yaml")
    with open(yamlpath, "w", encoding="utf-8") as f:
        yaml.dump(token_value, f, Dumper=yaml.RoundTripDumper)


cli.add_command(archive_model)
cli.add_command(login)


if __name__ == '__main__':
    cli()
    