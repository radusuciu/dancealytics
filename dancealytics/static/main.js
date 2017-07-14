Vue.use(VueResource);


var app = new Vue({
    el: '#app',
    data: {
        track: null,
        analysis: null,
        analysisCategories: [
            ['danceability', 'orange', 'Danceability describes how suitable a track is for dancing based on a combination of musical elements including tempo, rhythm stability, beat strength, and overall regularity.'],
            ['energy', 'yellow', 'Energy represents a perceptual measure of intensity and activity. Typically, energetic tracks feel fast, loud, and noisy. For example, death metal has high energy, while a Bach prelude scores low on the scale. Perceptual features contributing to this attribute include dynamic range, perceived loudness, timbre, onset rate, and general entropy.'],
            ['loudness', 'red', 'The overall loudness of a track in decibels (dB). Loudness values are averaged across the entire track and are useful for comparing relative loudness of tracks. Loudness is the quality of a sound that is the primary psychological correlate of physical strength (amplitude). Values typical range between -60 and 0 db.'],
            ['liveness', 'green', 'Detects the presence of an audience in the recording. Higher liveness values represent an increased probability that the track was performed live.'],
            ['acousticness', 'teal', 'A confidence measure of whether the track is acoustic'],
            ['speechiness', 'blue', 'Speechiness detects the presence of spoken words in a track. The more exclusively speech-like the recording (e.g. talk show, audio book, poetry), the closer to 100% the attribute value. Values above 66% describe tracks that are probably made entirely of spoken words. Values between 33% and 66% describe tracks that may contain both music and speech, either in sections or layered, including such cases as rap music. Values below 33% most likely represent music and other non-speech-like tracks.'],
            ['instrumentalness', 'pink', 'Predicts whether a track contains no vocals. "Ooh" and "aah" sounds are treated as instrumental in this context. Rap or spoken word tracks are clearly "vocal". The closer the instrumentalness value is to 100%, the greater likelihood the track contains no vocal content. Values above 50% are intended to represent instrumental tracks, but confidence is higher as the value approaches 100%.'],
            ['valence', 'purple', 'A measure describing the musical positiveness conveyed by a track. Tracks with high valence sound more positive (e.g. happy, cheerful, euphoric), while tracks with low valence sound more negative (e.g. sad, depressed, angry).'],
        ],
        selectedCategory: '',
        routeState: { query: undefined, id: undefined },
        $autocomplete: undefined
    },
    methods: {
        analyze: function(track) {
            this.route({ id: track.id });
            this.track = track;

            this.$http.get('/api/analyze/' + track.id).then(function(response) {
                // scaling loudness since it's a decibel value between -60 and 0
                // not picking -60 as the min point since the vast majority of tracks
                // are way above that
                var minLoudness = 20;
                var loudness = minLoudness - Math.abs(response.data[0].loudness);
                response.data[0].loudness = loudness / minLoudness;
                this.analysis = response.data[0];
            }, function(error_response) {

            });
        },
        getAutocomplete: function(term, callback) {
            // I know this function is redundant, but it is needed because
            // I had trouble with getting autocomplete to get the results, but not show them
            // this is what I get for trying to glue vue to semantic modules..
            this.$http.get('/api/autocomplete', { params: { term : term } }).then(callback);
        },
        apiToAutocomplete: function(response) {
            var results = [];

            for (var i = 0, n = response.data.length; i < n; i++) {
                results.push({
                    id: response.data[i][0],
                    title: response.data[i][3],
                    description: '<strong>' + response.data[i][2] + '</strong><br>' + response.data[i][1],
                    artist: response.data[i][1],
                    album: response.data[i][2],
                    image: response.data[i][4]
                });
            }

            return results;
        },
        route: function(state) {
            if (state.query) {
                state.query = encodeURIComponent(state.query);
            }

            this.routeState = _.assign(this.routeState, state);

            history.replaceState(
                this.routeState,
                '',
                '#' + this.routeState.query + (this.routeState.id ? ('/' + this.routeState.id) : '')
            );
        },
        setRouteFromURL: function() {
            var hash = window.location.hash.substr(1).split('/');
            var state = {};
            // avoid double encoding
            if (hash[0]) state.query = decodeURIComponent(hash[0]);
            if (hash[1]) state.id = hash[1];

            if (!_.isEmpty(state)) {
                this.routeState = state;
            }
        },
        syncRouteToApp: function() {
            var id = this.routeState.id;
            var query = this.routeState.query;

            if (query) {
                // we're putting this back as an input value, so decode first
                this.$autocomplete.search('set value', decodeURIComponent(query));

                if (id) {
                    // if we have an id, we search out of band
                    this.$autocomplete.addClass('loading');
                    this.getAutocomplete(query, function(response) {
                        this.$autocomplete.removeClass('loading');
                        var results = this.apiToAutocomplete(response.data);
                        this.analyze(_.find(results, { id: id }));
                    });
                } else {
                    this.$autocomplete.search('query');
                }
            }
        }
    },
    filters: {
        millisecondsToTime: function(milliseconds) {
            var seconds = Math.round(milliseconds / 1000);
            var minutes = Math.floor(seconds / 60);
            var remainder = seconds % 60;
            return minutes + ':' + ((remainder < 10) ? '0' : '') + remainder;
        }
    },
    mounted: function() {
        var me = this;
        this.setRouteFromURL();

        this.$autocomplete = $('.ui.search').search({
            apiSettings: {
                url: '/api/autocomplete?term={query}',
                onResponse: function(response) {
                    return { results: me.apiToAutocomplete(response) }
                }
            },
            maxResults: 7,
            onSearchQuery: function(query) {
                me.route({ query: query, id : undefined });
            },
            onSelect: me.analyze
        });

        // it is important that this happens after $autocomplete is set
        this.syncRouteToApp();
    }
});
