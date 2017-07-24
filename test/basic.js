/* global describe, it */

import mocha from 'mocha';
import should from 'should/as-function';

import Message from '../src';

describe('Message Interface', () => {
  const pluginsPath = `${__dirname}/plugins`;

  it('message basics', (done) => {
    Message.createMessage('This `is` a test, yes a test!', {}, (err, mo) => {
      should(mo.id).be.instanceof(String).and.have.lengthOf(8);
      should(mo.createdAt).be.instanceof(Date);
      should(mo.original).be.instanceof(String);
      should(mo.raw).be.instanceof(String);
      should(mo.clean).be.instanceof(String);
      done();
    });
  });

  it('Should call plugin', (done) => {
    Message.loadPlugins(pluginsPath);
    Message.createMessage('test', {}, (err, mo) => {
      should(mo.prop).equal('test???');
      done();
    });
  });

  it('Should contain tags', (done) => {
    Message.createMessage('Hello friend', {}, (err, mo) => {
      should(mo.tags).be.eql(['hello']);
      done();
    });
  });

  it('Numbers should be in numeric form', (done) => {
    Message.createMessage('what is one plus twenty-one', {}, (err, mo) => {
      should(mo.clean).be.eql('what is 1 plus 21');
      done();
    });
  });

  it('should find Date Obj', (done) => {
    Message.createMessage('If I was born on February 23 1980 how old am I', {}, (err, mo) => {
      should(mo.dates).not.be.empty();
      done();
    });
  });

  it('should find Date Obj 2', (done) => {
    Message.createMessage('Lets meet at 10 o\'clock', {}, (err, mo) => {
      should(mo.dates).not.be.empty();
      done();
    });
  });
  
  it('Should fetch entities', (done) => {
    Message.createMessage('Rob and Heather know Ashley and Brooklyn', {}, (err, mo) => {
      should(mo.entities).not.be.empty();
      // This still needs some work.
      // mo.entities.should.be.eql(['Rob', 'Heather', 'Ashley', 'Brooklyn']);
      done();
    });
  });

  it('Should pull out parts-of-speech', (done) => {
    Message.createMessage('I like the finner things.', {}, (err, mo) => {
      should(mo.nouns).not.be.empty();
      should(mo.pronouns).not.be.empty();
      should(mo.verbs).not.be.empty();
      done();
    });
  });

  it('Should pull out parts-of-speech 2', (done) => {
    Message.createMessage('She ran to Vancouver', {}, (err, mo) => {
      should(mo.nouns).have.lengthOf(1);
      should(mo.pronouns).have.lengthOf(1);
      should(mo.verbs).have.lengthOf(1);
      done();
    });
  });


  it('singalize', (done) => {
    Message.createMessage('i love shoes', {}, (err, mo) => {
      should(mo.lemString).eql('i love shoe');
      done();
    });
  });

  it('edge case 1', (done) => {
    Message.createMessage('okay my name is Adam', {}, (err, mo) => {
      should(mo.clean).eql('okay my name is Adam');
      done();
    });
  });

  it('edge case 2', (done) => {
    Message.createMessage('yes it is the capital of spain!', {}, (err, mo) => {
      should(mo.clean).eql('yes it is the capital of spain');
      done();
    });
  });

  it('edge case - remove colons', (done) => {
    Message.createMessage('what is time is 12:30 and: next: thing?', {}, (err, mo) => {
      should(mo.clean).eql('what is time is 12:30 and next thing');
      done();
    });
  });

  // This might have odd side effects when trying to evaluate math expressions
  it('edge case - remove parentheses', (done) => {
    Message.createMessage('who is (mario)', {}, (err, mo) => {
      should(mo.clean).eql('who is mario');
      done();
    });
  });

  it('Is Question', (done) => {
    Message.createMessage('test', {}, (err, mo) => {
      should(mo.isQuestion).be.false();

      Message.createMessage('test ?', {}, (err, mo) => {
        should(mo.isQuestion).be.true();

        Message.createMessage('what is a test', {}, (err, mo) => {
          should(mo.isQuestion).be.true();

          Message.createMessage('What is a test', {}, (err, mo) => {
            should(mo.isQuestion).be.true();

            Message.createMessage('do you think this is a test', {}, (err, mo) => {
              should(mo.isQuestion).be.true();
              done();

              // Skip
              // Message.createMessage('when interest rates were high, certificates of deposit provided impressive income.', {}, (err, mo) => {
              //   should(mo.isQuestion).be.false();
              //   done();
              // });

            });
          });
        });
      });
    });
  });


  describe('HasExpression Interface', () => {
    it('math 1', (done) => {
      Message.createMessage('what is ten plus ten?', {}, (err, mo) => {
        should(mo.expression).be.true();
        done();
      });
    });

    it('math 2', (done) => {
      Message.createMessage('when is ten oclock?', {}, (err, mo) => {
        should(mo.expression).be.false();
        done();
      });
    });

    it('math 3', (done) => {
      Message.createMessage('What is 1+1?', {}, (err, mo) => {
        should(mo.expression).be.true();
        done();
      });
    });

    it('math 4', (done) => {
      Message.createMessage('What is half of six?', {}, (err, mo) => {
        should(mo.expression).be.true();
        done();
      });
    });

  });

});
