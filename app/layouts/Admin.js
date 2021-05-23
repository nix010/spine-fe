import React, { useState } from 'react';
import { Col, Container, Row, Card, Form } from 'react-bootstrap';

function Admin() {
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
                        <label>About Me</label>
                        <Form.Control
                          onChange={e => setUrlList(e.target.value)}
                          value={urlList}
                          style={{ 'min-height': '200px' }}
                          placeholder="Here can be your description"
                          row="6"
                          as="textarea"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default Admin;
