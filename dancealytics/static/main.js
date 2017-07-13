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
        ]
    },
    methods: {
        analyze: function(track) {
            this.track = track;

            this.$http.get('/api/analyze/' + track.id).then(function(response) {
                this.analysis = response.data[0];
            }, function(error_response) {

            });
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

        $('.ui.search').search({
            apiSettings: {
                url: '/api/autocomplete?term={query}',
                onResponse: function(response) {
                    results = [];

                    for (var i = 0, n = response.data.length; i < n; i++) {
                        results.push({
                            id: response.data[i][0],
                            title: response.data[i][3],
                            description: response.data[i][1],
                            image: response.data[i][4]
                        });
                    }

                    return { results: results }
                }
            },
            onSelect: function(result) {
                me.analyze({
                    id: result.id,
                    artist: result.description,
                    title: result.title,
                    image: result.image
                });
            }
        });
    }
});
