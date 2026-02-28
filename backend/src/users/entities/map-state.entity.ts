import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	OneToOne,
	JoinColumn,
	UpdateDateColumn,
} from "typeorm";
import { ObjectType, Field, ID, Float } from "@nestjs/graphql";
import { User } from "./user.entity";

@ObjectType()
@Entity("map_states")
export class MapState {
	@Field(() => ID)
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Field(() => Float)
	@Column("decimal", { precision: 10, scale: 6, default: 2.3522 })
	latitude: number;

	@Field(() => Float)
	@Column("decimal", { precision: 10, scale: 6, default: 48.8566 })
	longitude: number;

	@Field(() => Float)
	@Column("decimal", { precision: 5, scale: 2, default: 6 })
	zoom: number;

	@Field(() => [String], { nullable: true })
	@Column("simple-array", { nullable: true })
	activeFilters: string[];

	@Field(() => [String], { nullable: true })
	@Column("simple-array", { nullable: true })
	visibleLayers: string[];

	@Field({ nullable: true })
	@Column({ nullable: true })
	selectedRegion: string;

	@Field({ nullable: true })
	@Column({ nullable: true })
	selectedDepartment: string;

	@Field({ nullable: true })
	@Column({ nullable: true })
	selectedCommune: string;

	@OneToOne(() => User, (user) => user.mapState)
	@JoinColumn()
	user: User;

	@Column()
	userId: string;

	@Field()
	@UpdateDateColumn()
	updatedAt: Date;
}
