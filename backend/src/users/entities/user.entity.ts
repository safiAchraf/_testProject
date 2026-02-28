import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	OneToOne,
} from "typeorm";
import { ObjectType, Field, ID, HideField } from "@nestjs/graphql";
import { MapState } from "./map-state.entity";

@ObjectType()
@Entity("users")
export class User {
	@Field(() => ID)
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Field()
	@Column({ unique: true })
	email: string;

	@Field()
	@Column()
	firstName: string;

	@Field()
	@Column()
	lastName: string;

	@HideField()
	@Column()
	password: string;

	@Field(() => MapState, { nullable: true })
	@OneToOne(() => MapState, (mapState) => mapState.user, { cascade: true })
	mapState: MapState;

	@Field()
	@CreateDateColumn()
	createdAt: Date;

	@Field()
	@UpdateDateColumn()
	updatedAt: Date;
}
