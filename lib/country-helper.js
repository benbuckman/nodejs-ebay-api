module.exports = {
    getExtension: function(country) {
        var extension = '';
        switch(country) {
          case 'US':
            extension = 'com';
            break;
          case 'UK':
            extension = 'co.uk';
            break;
          default:
            extension = 'com';
            break;
        }
      
        return extension;
    },
    //https://developer.ebay.com/devzone/merchandising/docs/concepts/siteidtoglobalid.html
    getSiteId: function(country) {
        var siteId = '';
        switch(country) {
            case 'US':
                siteId = 'EBAY-US';
                break;
            case 'UK':
                siteId = 'EBAY-GB';
                break;
            default:
                siteId = 'EBAY-US';
                break;
        }

        return siteId;
    },
    //https://developer.ebay.com/devzone/merchandising/docs/concepts/siteidtoglobalid.html
    getSiteCode: function(country) {
        var siteCode = '';
        switch(country) {
            case 'US':
                siteCode = '0';
                break;
            case 'UK':
                siteCode = '3';
                break;
            default:
                siteCode = '0';
                break;
        }

        return siteCode;
    }
};