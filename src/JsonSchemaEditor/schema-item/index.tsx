import * as React from "react";
import { FiSettings } from "react-icons/fi";
import { IoIosAddCircleOutline } from "react-icons/io";
import { AiOutlineDelete } from "react-icons/ai";
import { DropPlus } from "../drop-plus";
import { useHookstate, State, none } from "@hookstate/core";
import {
  JSONSchema7,
  JSONSchema7Definition,
  JSONSchema7TypeName,
} from "../../JsonSchemaEditor.types";
import {
  getDefaultSchema,
  DataType,
  SchemaTypes,
  random,
  handleTypeChange,
  FlexProps,
  ITEM_COL_CLASSNAME,
} from "../utils";
import { renameKeys, deleteKey } from "../utils";
import { useDebouncedCallback } from "use-debounce";
import { SchemaObject } from "../schema-object";
import { SchemaArray } from "../schema-array";
import { Col, Form, Row, Toast } from "react-bootstrap";
import { TooltipWrapper } from "../TooltipWrapper";
import { IconButton } from "../IconButton";

export interface SchemaItemProps extends FlexProps {
  required: string[];
  itemStateProp: State<JSONSchema7>;
  parentStateProp: State<JSONSchema7>;
  name: string;
  isReadOnly: State<boolean>;
  showadvanced: (item: string) => void;
}

export const SchemaItem: React.FunctionComponent<SchemaItemProps> = (
  props: React.PropsWithChildren<SchemaItemProps>,
) => {
  const {
    name,
    itemStateProp,
    showadvanced,
    required,
    parentStateProp,
    isReadOnly,
  } = props;

  // const itemState = useHookstate(itemStateProp);
  const parentState = useHookstate(parentStateProp);
  const parentStateOrNull: State<JSONSchema7> | undefined = parentState.ornull;
  const propertiesOrNull:
    | State<{
        [key: string]: JSONSchema7Definition;
      }>
    | undefined = parentStateOrNull.properties.ornull;

  const nameState = useHookstate(name);
  const isReadOnlyState = useHookstate(isReadOnly);
  const toastError = useHookstate<{
    title: string | undefined;
    description: string | undefined;
  }>({ title: undefined, description: undefined });

  const itemState = useHookstate(
    (
      parentStateProp.properties as State<{
        [key: string]: JSONSchema7;
      }>
    ).nested(nameState.value),
  );

  const isRequired = required
    ? required.length > 0 && required.includes(name)
    : false;

  // Debounce callback
  const debounced = useDebouncedCallback(
    // function
    (newValue: string) => {
      // Todo: make toast for duplicate properties
      if (propertiesOrNull && propertiesOrNull[newValue].value) {
        toastError.set({
          title: "Duplicate Property",
          description: `Property '${newValue}' already exists!`,
        });
      } else {
        const oldName = name;
        const proptoupdate = newValue;

        const newobj = renameKeys(
          { [oldName]: proptoupdate },
          parentState.properties.value,
        );
        parentStateOrNull.properties.set(JSON.parse(JSON.stringify(newobj)));
      }
    },
    // delay in ms
    1000,
  );

  if (!itemState.value) {
    return <></>;
  }

  return (
    <div>
      <Row className="m-0 p-0" style={{ height: "100%" }}>
        <Toast
          onClose={() =>
            toastError.set({
              title: undefined,
              description: undefined,
            })
          }
          show={toastError.value.title !== undefined}
          delay={3000}
          autohide
        >
          <Toast.Header>{toastError.value.title}</Toast.Header>
          <Toast.Body>{toastError.value.description}</Toast.Body>
        </Toast>

        {/* Vertial line on left margin */}
        <div className={"m-0 p-0 col-auto"}>
          <div className={"vr ms-1 pb-4"} style={{ height: "100%" }} />
        </div>

        <Col className={"p-0 my-0 ms-2"}>
          <Form className="schema-item">
            <Row className="align-items-center">
              <Col xs={"auto"} className={ITEM_COL_CLASSNAME}>
                <Form.Control
                  type="text"
                  disabled={isReadOnlyState.value}
                  defaultValue={nameState.value}
                  size="sm"
                  placeholder="Enter property name"
                  onChange={(evt: React.ChangeEvent<HTMLInputElement>) => {
                    debounced(evt.target.value);
                  }}
                />
              </Col>

              <Col xs={"auto"} className={ITEM_COL_CLASSNAME}>
                <TooltipWrapper label="Required">
                  <Form.Check
                    disabled={isReadOnlyState.value}
                    checked={isRequired}
                    className="px-0 ms-0 me-0"
                    onChange={(evt: React.ChangeEvent<HTMLInputElement>) => {
                      if (!evt.target.checked && required.includes(name)) {
                        (parentState.required as State<string[]>)[
                          required.indexOf(name)
                        ].set(none);
                      } else {
                        parentState.required.merge([name]);
                      }
                    }}
                  />
                </TooltipWrapper>
              </Col>

              <Col xs={"auto"} className={ITEM_COL_CLASSNAME}>
                <Form.Select
                  disabled={false}
                  value={itemState.type.value}
                  size="sm"
                  onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
                    const newSchema = handleTypeChange(
                      evt.target.value as JSONSchema7TypeName,
                      false,
                    );
                    itemState.set(newSchema as JSONSchema7);
                  }}
                >
                  {SchemaTypes.map((item, index) => {
                    return (
                      <option key={String(index)} value={item}>
                        {item}
                      </option>
                    );
                  })}
                </Form.Select>
              </Col>

              <Col xs={"auto"} className={ITEM_COL_CLASSNAME}>
                <Form.Control
                  type="text"
                  disabled={isReadOnlyState.value}
                  value={itemState.title.value || ""}
                  size="sm"
                  placeholder="Add Title"
                  onChange={(evt: React.ChangeEvent<HTMLInputElement>) => {
                    itemState.title.set(evt.target.value);
                  }}
                />
              </Col>

              <Col className={ITEM_COL_CLASSNAME}>
                <Form.Control
                  type="text"
                  disabled={isReadOnlyState.value}
                  value={itemState.description.value || ""}
                  size="sm"
                  placeholder="Add Description"
                  onChange={(evt: React.ChangeEvent<HTMLInputElement>) => {
                    itemState.description.set(evt.target.value);
                  }}
                />
              </Col>

              <Col xs={"auto"} className={ITEM_COL_CLASSNAME}>
                {itemState.type.value !== "object" &&
                  itemState.type.value !== "array" && (
                    <TooltipWrapper label="Advanced Settings">
                      <IconButton
                        isRound
                        isDisabled={isReadOnlyState.value}
                        size="sm"
                        variant="link"
                        colorScheme="blue"
                        fontSize="16px"
                        icon={<FiSettings />}
                        aria-label="Advanced Settings"
                        onClick={() => {
                          showadvanced(name);
                        }}
                      />
                    </TooltipWrapper>
                  )}
              </Col>

              <Col xs={"auto"} className={ITEM_COL_CLASSNAME}>
                <TooltipWrapper label="Remove Node">
                  <IconButton
                    isRound
                    isDisabled={isReadOnlyState.value}
                    size="sm"
                    variant="link"
                    colorScheme="red"
                    fontSize="16px"
                    icon={<AiOutlineDelete />}
                    aria-label="Remove Node"
                    onClick={() => {
                      const updatedState = deleteKey(
                        nameState.value,
                        JSON.parse(
                          JSON.stringify(parentState.properties.value),
                        ),
                      );
                      parentState.properties.set(updatedState);
                    }}
                  />
                </TooltipWrapper>
              </Col>

              <Col xs={"auto"} className={ITEM_COL_CLASSNAME}>
                {itemState.type?.value === "object" ? (
                  <DropPlus
                    isDisabled={isReadOnlyState.value}
                    parentStateProp={parentState}
                    itemStateProp={itemStateProp}
                  />
                ) : (
                  <TooltipWrapper
                    hasArrow
                    aria-label="Add Sibling Node"
                    label="Add Sibling Node"
                    placement="top"
                  >
                    <IconButton
                      isRound
                      isDisabled={isReadOnlyState.value}
                      size="sm"
                      variant="link"
                      colorScheme="green"
                      fontSize="16px"
                      icon={<IoIosAddCircleOutline />}
                      aria-label="Add Sibling Node"
                      onClick={() => {
                        if (propertiesOrNull) {
                          const fieldName = `field_${random()}`;
                          propertiesOrNull
                            ?.nested(fieldName)
                            .set(
                              getDefaultSchema(DataType.string) as JSONSchema7,
                            );
                        }
                      }}
                    />
                  </TooltipWrapper>
                )}
              </Col>
            </Row>
          </Form>

          {itemState.type?.value === "object" && (
            <SchemaObject
              isReadOnly={isReadOnlyState}
              schemaState={itemState}
            />
          )}

          {itemState.type?.value === "array" && (
            <SchemaArray isReadOnly={isReadOnlyState} schemaState={itemState} />
          )}
        </Col>
      </Row>
    </div>
  );
};
