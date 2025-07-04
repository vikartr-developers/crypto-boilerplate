import { Test, TestingModule } from '@nestjs/testing';
import { ScriptController } from './script.controller';

describe('ScriptController', () => {
  let controller: ScriptController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ScriptController],
    }).compile();

    controller = module.get<ScriptController>(ScriptController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
