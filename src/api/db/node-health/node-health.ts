import {
  BaseEntity,
  Column,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index
} from "typeorm";

@Entity({ name: 'node_health' })
export class NodeHealth extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  group_name: string;

  @Column()
  endpoint_url: string;

  @Index()
  @Column({ type: 'timestamp' })
  timeStamp: Date;  // 문자열 대신 Date 타입 사용

  @Column()
  txHash: string;

  @Column()
  active: string;

  @Column({ nullable: true })  // 로그가 길어질 수 있으므로 TEXT 타입 사용
  log: string;

  @UpdateDateColumn()
  updatedAt: Date;
}