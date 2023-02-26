import assert from 'assert';
import { TestHelper } from '../utils';
import { ErrorTypes } from '../../src/server/utils/configureResponseHandlers';
import request from 'supertest';
import { Project, User, Blueprint, Component } from '../../src/models';
import { componentBlueprintPayload, componentCreatePayload } from './data';
const testHelper = new TestHelper();
const serverUrl = testHelper.getServerUrl();
let apiRoute = '/projects/:projectId/components';

describe('[Component] Get All', () => {
  describe(`GET ${apiRoute}`, () => {
    let testProject: Project;
    let testUser: User;
    let testBlueprint: Blueprint;
    let testComponent: Component;
    let authToken: string;
    let notAuthorizedToken: string;

    beforeAll(async () => {
      testUser = await testHelper.createTestUser();
      const notAuthorizedUser = await testHelper.createTestUser();
      testProject = await testHelper.createTestProject(testUser);
      testBlueprint = await testProject.createBlueprint({
        ...componentBlueprintPayload,
        name: testHelper.generateUUID(),
        version: 6,
        createdById: testUser.id,
      });
      await testProject.createComponent({
        ...componentCreatePayload,
        name: testHelper.generateUUID(),
        blueprintId: testBlueprint.id,
        blueprintVersion: testBlueprint.version,
        createdById: testUser.id,
      });
      await testProject.createComponent({
        ...componentCreatePayload,
        name: testHelper.generateUUID(),
        blueprintId: testBlueprint.id,
        blueprintVersion: testBlueprint.version,
        createdById: testUser.id,
      });
      await testProject.createComponent({
        ...componentCreatePayload,
        name: testHelper.generateUUID(),
        blueprintId: testBlueprint.id,
        blueprintVersion: testBlueprint.version,
        createdById: testUser.id,
      });
      await testProject.createComponent({
        ...componentCreatePayload,
        name: testHelper.generateUUID(),
        blueprintId: testBlueprint.id,
        blueprintVersion: testBlueprint.version,
        createdById: testUser.id,
      });
      await testProject.createComponent({
        ...componentCreatePayload,
        name: testHelper.generateUUID(),
        blueprintId: testBlueprint.id,
        blueprintVersion: testBlueprint.version,
        createdById: testUser.id,
      });
      testComponent = await testProject.createComponent({
        ...componentCreatePayload,
        name: testHelper.generateUUID(),
        blueprintId: testBlueprint.id,
        blueprintVersion: testBlueprint.version,
        createdById: testUser.id,
        updatedOn: new Date(),
        updatedById: testUser.id,
      });
      authToken = testHelper.generateToken(testUser);
      notAuthorizedToken = testHelper.generateToken(notAuthorizedUser);
    });

    afterAll(async () => {
      await testHelper.removeTestData();
    });

    beforeEach(() => {
      apiRoute = `/projects/${testProject.id}/components`;
    });

    it('should reject requests when x-auth-token is missing', (done) => {
      request(serverUrl).get(apiRoute).expect(
        400,
        {
          error: 'x-auth-token header is missing from input',
          errorType: ErrorTypes.VALIDATION,
        },
        done,
      );
    });

    it('should reject requests that have an invalid project id', (done) => {
      apiRoute = '/projects/wrong/components';
      request(serverUrl).get(apiRoute).set('x-auth-token', authToken).expect(
        400,
        {
          error: 'requested project id is not valid',
          errorType: ErrorTypes.VALIDATION,
        },
        done,
      );
    });

    it('should reject requests when the project is not found', (done) => {
      apiRoute = `/projects/${testHelper.generateUUID()}/components`;
      request(serverUrl).get(apiRoute).set('x-auth-token', authToken).expect(
        404,
        {
          error: 'requested project not found',
          errorType: ErrorTypes.NOT_FOUND,
        },
        done,
      );
    });

    it('should reject requests from users that are not project members', (done) => {
      request(serverUrl).get(apiRoute).set('x-auth-token', notAuthorizedToken).expect(
        401,
        {
          error: 'you do not have permission to read components',
          errorType: ErrorTypes.AUTHORIZATION,
        },
        done,
      );
    });

    it('should successfully return a list of components', (done) => {
      apiRoute = `${apiRoute}?itemsPerPage=1&page=6`;
      request(serverUrl)
        .get(apiRoute)
        .set('x-auth-token', authToken)
        .expect(200)
        .end((err, res) => {
          if (err) {
            return done(err);
          }

          const {
            message,
            components,
            project,
            page,
            totalItems,
            totalPages,
            itemsPerPage,
          } = res.body;
          assert.strictEqual(message, 'component list has been successfully retrieved');
          assert(project);
          assert.strictEqual(project.id, testProject.id);
          assert.strictEqual(project.name, testProject.name);
          assert.strictEqual(page, 6);
          assert.strictEqual(totalItems, 6);
          assert.strictEqual(totalPages, 6);
          assert.strictEqual(itemsPerPage, 1);
          assert.strictEqual(components.length, 1);

          const component = components[0];
          assert.strictEqual(component.id, testComponent.id);
          assert.strictEqual(component.name, testComponent.name);
          assert.strictEqual(component.createdOn, testComponent.createdOn.toISOString());
          assert(component.createdBy);
          assert.strictEqual(component.createdBy.displayName, testUser.displayName);
          assert.strictEqual(component.createdBy.username, testUser.username);

          assert.strictEqual(component.updatedOn, testComponent.updatedOn?.toISOString());
          assert(component.updatedBy);
          assert.strictEqual(component.updatedBy.displayName, testUser.displayName);
          assert.strictEqual(component.updatedBy.username, testUser.username);

          assert(component.blueprint);
          assert.strictEqual(component.blueprint.id, testBlueprint.id);
          assert.strictEqual(component.blueprint.name, testBlueprint.name);
          assert.strictEqual(component.blueprint.version, testBlueprint.version);
          done();
        });
    });
  });
});
