Vue.use(VueResource);

var app = new Vue({
    el: '#app',
    data: {
        track: null,
    },
    methods: {

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
                            title: response.data[i][2],
                            description: response.data[i][1],
                            image: response.data[i][3]
                        });
                    }

                    return { results: results }
                }
            },
    }
});
