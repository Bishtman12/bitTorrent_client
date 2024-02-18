class DownloadManager {

    constructor() {

        this.worker_queue = [];
        this.peers = {};
    }

    async startDownload(){

        // check in the worker_queue for any pending piece_index

        for (const piece of this.worker_queue){
            if (piece.state == "pending"){
                // start downloading that piece
            }
        }

    }

    async downloadPiece(){

        // find the peers which is free

    }

}


/* ! worker_queue = [

    {
        piece_index : 0,
        state: ,pending , downloaded , in-progress
    },

]

peers : {
    ip : 0,1
}

*/
