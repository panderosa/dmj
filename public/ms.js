var ids = AWSIntegrationHelper.getVolumeIds(request.region)

var availableValues = [];
for (var id in ids) {

    var availableRow = {
        'value' : ids[id],
        'displayName' : ids[id]
    };

    availableValues.push(availableRow);
}