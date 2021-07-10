import os
import json
import urllib.request

app_name = os.environ['APP_NAME']
env_name = os.environ['ENV_NAME']
profile_name = os.environ['PROFILE_NAME']


def handler(event, context):
    return {
       'configuration': json.loads(get_configuration(app_name, env_name, profile_name))
    }


def get_configuration(app, env, profile):
    url = f'http://localhost:2772/applications/{app}/environments/{env}/configurations/{profile}'
    return urllib.request.urlopen(url, timeout=2).read()