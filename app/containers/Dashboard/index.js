import React, { useState } from 'react';
import { Col, Container, Row, Card, Form, Button } from 'react-bootstrap';

function Dashboard() {
  const [urlList, setUrlList] = useState('');
  return (
    <>
      <Container fluid>
        <Row>
          <Col md="12">
            <Card>
              <Card.Header>
                <Card.Title as="h4">Url</Card.Title>
              </Card.Header>
              <Card.Body>
                <Form>
                  <Row>
                    <Col md="12">
                      <Form.Group>
                        <label>URL</label>
                        <Form.Control
                          onChange={e => setUrlList(e.target.value)}
                          value={urlList}
                          style={{ minHeight: '200px' }}
                          placeholder="Here can be your description"
                          as="textarea"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <div className="button-container mr-auto ml-auto">
                    <Button
                      className="btn btn-danger"
                      href="#pablo"
                      onClick={(e) => e.preventDefault()}
                      variant="link"
                    >
                      Check index
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default Dashboard;
