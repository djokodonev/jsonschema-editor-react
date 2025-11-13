import * as React from "react";
import { useHookstate, State } from "@hookstate/core";
import { JSONSchema7, JSONSchema7TypeName } from "../../JsonSchemaEditor.types";
import { IoIosAddCircleOutline } from "react-icons/io";
import {
  getDefaultSchema,
  DataType,
  random,
  handleTypeChange,
  FlexProps,
  ITEM_COL_CLASSNAME,
} from "../utils";
import { Col, Form, OverlayTrigger, Row, Tooltip } from "react-bootstrap";
import { IconButton } from "../IconButton";
import { TooltipWrapper } from "../TooltipWrapper";

export interface SchemaArrayProps extends FlexProps {
  schemaState: State<JSONSchema7>;
  onSchemaChange?: (results: string) => void;
  isReadOnly: State<boolean>;
}

export const SchemaRoot: React.FunctionComponent<SchemaArrayProps> = (
  props: React.PropsWithChildren<SchemaArrayProps>,
) => {
  const state = useHookstate(props.schemaState);
  const isReadOnlyState = useHookstate(props.isReadOnly);

  return (
    <>
      {props.onSchemaChange &&
        props.onSchemaChange(JSON.stringify(state.value))}
      <div data-testid="jsonschema-editor">
        <Row className="align-items-center">
          <Col xs={"auto"} className={ITEM_COL_CLASSNAME}>
            <Form.Control type="text" disabled placeholder="root" size="sm" />
          </Col>

          <Col xs={"auto"} className={ITEM_COL_CLASSNAME}>
            <TooltipWrapper label={"All Required"}>
              <Form.Check
                disabled={isReadOnlyState.value}
                inline
                type="checkbox"
                className="px-0 ms-0 me-0"
              />
            </TooltipWrapper>
          </Col>

          <Col xs={"auto"} className={ITEM_COL_CLASSNAME}>
            <Form.Select
              disabled={true}
              value={state.type.value ?? ""}
              size="sm"
              onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
                const newSchema = handleTypeChange(
                  evt.target.value as JSONSchema7TypeName,
                  false,
                );
                state.set(newSchema as JSONSchema7);
              }}
            >
              <option key="object" value="object">
                object
              </option>
            </Form.Select>
          </Col>

          <Col xs={"auto"} className={ITEM_COL_CLASSNAME}>
            <Form.Control
              type="text"
              value={state.value?.title ?? ""}
              disabled={isReadOnlyState.value}
              size="sm"
              placeholder="Add Title"
              onChange={(evt: React.ChangeEvent<HTMLInputElement>) => {
                state.title.set(evt.target.value);
              }}
            />
          </Col>

          <Col className={ITEM_COL_CLASSNAME}>
            <Form.Control
              type="text"
              value={state.value?.description ?? ""}
              disabled={isReadOnlyState.value}
              size="sm"
              placeholder="Add Description"
              onChange={(evt: React.ChangeEvent<HTMLInputElement>) => {
                state.description.set(evt.target.value);
              }}
            />
          </Col>

          {state.value?.type === "object" && (
            <Col xs={"auto"} className={ITEM_COL_CLASSNAME}>
              <OverlayTrigger
                overlay={<Tooltip>Add Child Node</Tooltip>}
                aria-label="Add Child Node"
                placement="top"
              >
                <IconButton
                  isDisabled={isReadOnlyState.value}
                  size="sm"
                  variant="link"
                  colorScheme="green"
                  aria-label="Add Child Node"
                  onClick={() => {
                    const fieldName = `field_${random()}`;
                    (
                      state.properties as State<{
                        [key: string]: JSONSchema7;
                      }>
                    )[fieldName].set(getDefaultSchema(DataType.string));
                  }}
                  icon={<IoIosAddCircleOutline />}
                />
              </OverlayTrigger>
            </Col>
          )}
        </Row>
      </div>
    </>
  );
};
