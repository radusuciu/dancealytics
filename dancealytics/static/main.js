Vue.use(VueResource);


var app = new Vue({
    el: '#app',
    data: {
        track: null,
        analysis: null,
        analysisCategories: [
            ['danceability', 'orange'],
            ['energy', 'yellow'],
            ['loudness', 'red'],
            ['liveness', 'green'],
            ['acousticness', 'teal'],
            ['speechiness', 'blue'],
            ['instrumentalness', 'pink'],
            ['valence', 'purple'],
        ],
        routeState: { query: undefined, id: undefined },
        $autocomplete: undefined
    },
    methods: {
        analyze: function(track) {
            this.route({ id: track.id });
            this.track = track;

            this.$http.get('/api/analyze/' + track.id).then(function(response) {
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
                    this.getAutocomplete(query, function(response) {
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
            maxResults: 10,
            onSearchQuery: function(query) {
                me.route({ query: query, id : undefined });
            },
            onSelect: me.analyze
        });

        // it is important that this happens after $autocomplete is set
        this.syncRouteToApp();
    }
});
