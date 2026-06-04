const express = require('express');
const router = express.Router();

const {
    createBetaRequest,
    getPendingRequests,
    getAcceptedRequests,
    getInvitedRequests,
    getRejectedRequests,
    acceptToWaitlist,
    inviteUser,
    rejectBetaRequest
} = require('../controllers/betaController');

router.post('/beta-request', createBetaRequest);

router.get('/beta/pending', getPendingRequests);

router.get('/beta/accepted', getAcceptedRequests);

router.get('/beta/invited', getInvitedRequests);

router.get('/beta/rejected', getRejectedRequests);

router.post('/beta/accept/:id', acceptToWaitlist);

router.post('/beta/invite/:id', inviteUser);

router.post('/beta/reject/:id', rejectBetaRequest);

module.exports = router;