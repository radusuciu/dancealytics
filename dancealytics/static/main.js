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
        _routeState: { query: undefined, id: undefined },
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
        route: function(state) {
            if (state.query) {
                state.query = encodeURIComponent(state.query);
            }

            this._routeState = _.assign(this._routeState, state);

            history.replaceState(
                this._routeState,
                '',
                '#' + this._routeState.query + (this._routeState.id ? ('/' + this._routeState.id) : '')
            );
        },
        setRouteFromURL: function() {
            var hash = window.location.hash.substr(1).split('/');
            var state = {};
            // avoid double encoding
            if (hash[0]) state.query = decodeURIComponent(hash[0]);
            if (hash[1]) state.id = hash[1]

            if (!_.isEmpty(state)) {
                this._routeState = state;
            }
        },
        syncRouteToApp: function() {
            var id = this._routeState.id;
            var query = this._routeState.query;

            if (query) {
                if (id) $('.results').addClass('hide'); // hide results if we have an id
            
                // we're putting this back as an input value, so decode first
                this.$autocomplete.search('set value', decodeURIComponent(query));

                // trigger query and select track by id if id is set
                // note that by doing this, we initially clear the id from route until we select it again
                // this causes a server-trip long change in the url, but I think that's acceptable.
                this.$autocomplete.search('query', function() {
                    if (id) {
                        var track = this.$autocomplete.search('get result', id);

                        // ideally we could do something like
                        // this.autocomplete.search('select', id)
                        // which would trigger analyze automatically, but this behaviour is not documented
                        // or does not exist for UI-Search at this time.
                        this.analyze(track);

                        this.$autocomplete.search('hide results', function() {
                            // in a callback to account for transition that 'hide results' does
                            $('.results').removeClass('hide');
                        });
                    }
                }.bind(this));
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
                    results = [];

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

                    return { results: results }
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
