import click, shutil, os
from pathlib import Path
from ntcore import Client

FRAMEWORKS = ['sklearn', 'tensorflow', 'pytorch']

@click.command()
@click.option('--server', '-s', default='http://localhost:8000', help='ntcore server endpoint')
@click.option('--workspace-id', '-w', required=True, help='target workspace id')
@click.option('--framework', '-f', default=None, required=True, help='framework to run models, i.e., sklearn, tensorflow, pytorch etc')
@click.argument('root')
def archive_model(server, workspace_id, framework, root):
    '''
    Archive the target python code as serialized file.
    '''
    if framework not in FRAMEWORKS:
        click.echo(click.style("Error", fg="red") + ": Invalid framework, acceptable values are sklearn, tensorflow, pytorch.")
        exit(1)

    click.echo(f"Archiving {root} ...")

    client = Client(server=server)
    with client.start_run(workspace_id) as exper:
        exper.framework = framework
        click.echo(f"Uploading archived model to NTCore ...")
        exper.save_model(root)

    """
    try:
        dir = root if os.path.isabs(root) else Path(root).absolute()
        click.echo(f"Archiving {dir} ...")
        archive_name = "ntcore_model_archive"
        shutil.make_archive(archive_name, "gztar", dir)

        client = Client(server=server)
        with client.start_run(workspace_id) as exper:
            exper.framework = framework


            serialized = open(archive_name + ".tar.gz", "rb").read()
            click.echo(f"Uploading archived model to NTCore ...")
            exper.save_model(serialized)


        os.remove(archive_name + ".tar.gz")

    except Exception:
        client = Client(server=server)
        with client.start_run(workspace_id) as exper:
            exper.framework = framework
            click.echo(f"Uploading archived model to NTCore ...")
            exper.save_model(root)
    """


if __name__ == '__main__':
    archive_model()
