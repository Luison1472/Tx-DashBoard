import { Repository } from 'typeorm';
import { CustomRepository } from "../typeorm-ex.decorator";
import { NodeHealth } from "./node-health";


@CustomRepository(NodeHealth)
export class NodeHealthRepository extends Repository<NodeHealth> {}