import { OperationType } from '../../../../modules/statements/entities/Statement';
import { InMemoryStatementsRepository } from '../../../../modules/statements/repositories/in-memory/InMemoryStatementsRepository';
import { IStatementsRepository } from '../../../../modules/statements/repositories/IStatementsRepository';
import { CreateStatementError } from '../../../../modules/statements/useCases/createStatement/CreateStatementError';
import { CreateStatementUseCase } from '../../../../modules/statements/useCases/createStatement/CreateStatementUseCase';
import { InMemoryUsersRepository } from '../../../../modules/users/repositories/in-memory/InMemoryUsersRepository';
import { IUsersRepository } from '../../../../modules/users/repositories/IUsersRepository';

let inMemoryUsersRepository: IUsersRepository;
let inMemoryStatementsRepository: IStatementsRepository;

let createStatementUseCase: CreateStatementUseCase;

describe('Create Statement', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    inMemoryStatementsRepository = new InMemoryStatementsRepository();

    createStatementUseCase = new CreateStatementUseCase(
      inMemoryUsersRepository,
      inMemoryStatementsRepository,
    );
  });

  it('should be able to create a new statement for a user', async () => {
    const user = await inMemoryUsersRepository.create({
      name: 'name',
      email: 'email@mail.com',
      password: 'password',
    });

    const statement = await createStatementUseCase.execute({
      user_id: user.id as string,
      type: OperationType.DEPOSIT,
      amount: 1000,
      description: 'description',
    });

    expect(statement).toHaveProperty('id');
  });

  it('should not be able to create a new statement for a user that does not exist', async () => {
    await expect(
      createStatementUseCase.execute({
        user_id: 'user_id',
        type: OperationType.DEPOSIT,
        amount: 1000,
        description: 'description',
      }),
    ).rejects.toBeInstanceOf(CreateStatementError.UserNotFound);
  });

  it('should not be able to create a new statement for a user when the user do not have balance enough', async () => {
    const user = await inMemoryUsersRepository.create({
      name: 'name',
      email: 'email@mail.com',
      password: 'password',
    });

    await createStatementUseCase.execute({
      user_id: user.id as string,
      type: OperationType.DEPOSIT,
      amount: 500,
      description: 'description',
    });

    expect(
      createStatementUseCase.execute({
        user_id: user.id as string,
        type: OperationType.WITHDRAW,
        amount: 1000,
        description: 'description',
      }),
    ).rejects.toBeInstanceOf(CreateStatementError.InsufficientFunds);
  });

  it('should be able to create a new statement for a user when the user have balance enough', async () => {
    const user = await inMemoryUsersRepository.create({
      name: 'name',
      email: 'email@mail.com',
      password: 'password',
    });

    await createStatementUseCase.execute({
      user_id: user.id as string,
      type: OperationType.DEPOSIT,
      amount: 1000,
      description: 'description',
    });

    const statement = await createStatementUseCase.execute({
      user_id: user.id as string,
      type: OperationType.WITHDRAW,
      amount: 100,
      description: 'description',
    });

    expect(statement).toHaveProperty('id');
  });
});
