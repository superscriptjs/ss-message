import mocha from 'mocha';
import should from 'should';

import Message from '../src';

describe('Message Interface', () => {

  const pluginsPath = `${__dirname}/plugins`;

  it('message basics', (done) => {
    Message.createMessage('This `is` a test, yes a test!', {}, (err, mo) => {
      mo.id.should.be.instanceof(String).and.have.lengthOf(8);
      mo.createdAt.should.be.instanceof(Date);
      mo.original.should.be.instanceof(String);
      mo.raw.should.be.instanceof(String);
      mo.clean.should.be.instanceof(String);
      done();
    });
  });

  it('Should call plugin', (done) => {
    Message.createMessage('test', {pluginsPath}, (err, mo) => {
      mo.plugins.should.be.instanceof(Object).and.have.key('qm');
      mo.prop.should.equal('test???');
      done();
    });
  });


  describe.skip('Old Interface', () => {
    // FIXME: Currently returning [ 'Heather', 'Sydney', 'Rob Ellis', 'Ashley Brooklyn' ]
    it('should parse names and nouns from message 1', (done) => {
      Message.createMessage('Rob Ellis and Heather know Ashley, Brooklyn and Sydney.', { factSystem }, (mo) => {
        mo.names.should.be.instanceof(Array).and.have.lengthOf(5);
        mo.nouns.should.be.instanceof(Array).and.have.lengthOf(6);
        done();
      });
    });

    // FIXME: Some tests are skipped because 'Concepts' no longer exists: this needs looking at
    it("should parse names and nouns from message 2 - this pulls names from scripted concepts since they are not NNP's", (done) => {
      Message.createMessage('heather knows Ashley, brooklyn and sydney.', { factSystem }, (mo) => {
        mo.names.should.be.instanceof(Array).and.have.lengthOf(4);
        done();
      });
    });

    it('should parse names and nouns from message 3 - some NN NN should burst', (done) => {
      Message.createMessage('My friend steve likes to play tennis', { factSystem }, (mo) => {
        mo.nouns.should.be.instanceof(Array).and.have.lengthOf(3);
        mo.names.should.be.instanceof(Array).and.have.lengthOf(1);
        done();
      });
    });

    it('should have nouns with names filters out (cNouns)', (done) => {
      Message.createMessage('My friend Bob likes to play tennis', { factSystem }, (mo) => {
        mo.nouns.should.be.instanceof(Array).and.have.lengthOf(3);
        mo.names.should.be.instanceof(Array).and.have.lengthOf(1);
        mo.cNouns.should.be.instanceof(Array).and.have.lengthOf(2);
        done();
      });
    });

    it('should find compare', (done) => {
      Message.createMessage('So do you like dogs or cats.', { factSystem }, (mo) => {
        mo.questionType.should.eql('CH');
        done();
      });
    });

    it('should find compare words 2', (done) => {
      Message.createMessage('What is bigger a dog or cat?', { factSystem }, (mo) => {
        mo.questionType.should.eql('CH');
        done();
      });
    });

    it('should find context', (done) => {
      Message.createMessage('They are going on holidays', { factSystem }, (mo) => {
        mo.pnouns.should.containEql('they');
        done();
      });
    });

    it('should convert to numeric form 1', (done) => {
      Message.createMessage('what is one plus twenty-one', { factSystem }, (mo) => {
        mo.numbers.should.eql(['1', '21']);
        mo.numericExp.should.be.true;
        done();
      });
    });

    it('should convert to numeric form 2', (done) => {
      Message.createMessage('what is one plus three hundred and forty-five', { factSystem }, (mo) => {
        mo.numbers.should.eql(['1', '345']);
        mo.numericExp.should.be.true;
        done();
      });
    });

    it('should convert to numeric form 3', (done) => {
      Message.createMessage('five hundred thousand and three hundred and forty-five', { factSystem }, (mo) => {
        mo.numbers.should.eql(['500345']);
        done();
      });
    });

    it('should convert to numeric form 4', (done) => {
      // This this actually done lower down in the stack. (normalizer)
      const mo = Message.createMessage('how much is 1,000,000', { factSystem }, (mo) => {
        mo.numericExp.should.be.false;
        mo.numbers.should.eql(['1000000']);
        done();
      });
    });

    it('should find expression', (done) => {
      Message.createMessage('one plus one = two', { factSystem }, (mo) => {
        mo.numericExp.should.be.true;
        done();
      });
    });

    it('should find Date Obj', (done) => {
      Message.createMessage('If I was born on February 23  1980 how old am I', { factSystem }, (mo) => {
        mo.date.should.not.be.empty;
        done();
      });
    });

    it('should find Concepts', (done) => {
      Message.createMessage('tell that bitch to fuck off', { factSystem }, (mo) => {
        mo.sentiment.should.eql(-7);
        done();
      });
    });

    it('should find concepts 2', (done) => {
      Message.createMessage('I watched a movie last week with my brother.', { factSystem }, (mo) => {
        done();
      });
    });
  });
});
