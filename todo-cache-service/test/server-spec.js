const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../server');

// Configure chai
chai.use(chaiHttp);
chai.should();

describe('Todos', () => {
    it('should get all todo objects', (done) => {
        chai.request(server)
            .get('/api/v1/todos')
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('array');
                done();
            });
    });
});

