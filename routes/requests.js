const express = require('express');
const router = express.Router();
const csa = require('../csa.js');

router.get('/:requestId', (req,res) => {
    var requestId = req.params.requestId;
    var out = csa.getDetails(catalogId,requestId);
    res.json(out);
});




module.exports = router;