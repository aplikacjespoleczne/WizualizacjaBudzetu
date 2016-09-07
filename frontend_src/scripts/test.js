$(document).ready(function(){
  var suggestions = new Bloodhound({
    datumTokenizer: function(data) {
      return Bloodhound.tokenizers.obj.whitespace(d.val)
    },
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    remote: {
      url: 'http://localhost:8080/query?query=%QUERY'
      //filter: function(parsedResponse) {
      //  parsedResponse.map(function(record){
      //    return { value: record };
      //  });
      //}
    }
  });
  suggestions.initialize();
  $('.typeahead').typeahead({
    minLength: 3
  },
  {
    displayKey: 'value',
    source: suggestions.ttAdapter()
  })
});
