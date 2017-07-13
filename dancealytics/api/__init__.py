from spotipy.oauth2 import SpotifyClientCredentials
import config.config as config
import spotipy


client_credentials_manager = SpotifyClientCredentials(
    client_id=config.config.SPOTIFY_CLIENT_ID,
    client_secret=config.config.SPOTIFY_CLIENT_SECRET
)

sp = spotipy.Spotify(client_credentials_manager=client_credentials_manager)


def search(term):
    return sp.search(term, type='track', limit=10)

def autocomplete(term):
    tracks = search(term)['tracks']['items']
    return [(
        track['id'],
        ', '.join(a['name'] for a in track['artists']),
        track['album']['name'],
        track['name'],
        track['album']['images'][0]['url'],
    ) for track in tracks]

def analyze(track_id):
    return sp.audio_features(track_id)
