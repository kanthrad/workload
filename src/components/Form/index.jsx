import "./css/style.css";

import { useState } from "react";

import { doc, setDoc } from "firebase/firestore";
import { db } from "../../firebase";

import { Row, Col, Input, InputNumber, DatePicker, Button, Drawer } from "antd";

function Form() {
  const [collectionDate, setCollectionDate] = useState("");
  const [taskDate, setTaskDate] = useState("");
  const [taskHours, setTaskHours] = useState(0);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [taskProject, setTaskProject] = useState("");
  const [inputHours, setInputHours] = useState(0);
  const [taskSecret, setTaskSecret] = useState("");

  const user = "dk";

  const addTask = async (e) => {
    e.preventDefault();
    if (taskDate && taskHours && taskProject && taskSecret) {
      /**
       * prepare and add values to database
       * taskProject @type String
       * taskDate @type String
       * taskHours @type Number | round to integer
       */
      let project = taskProject
        .replace(/[^A-Za-zА-ЯЁа-яё0-9.]/g, "")
        .toLowerCase();
      let date = Number(taskDate);
      try {
        await setDoc(
          doc(
            db,
            "tasks-" + user + "-" + collectionDate,
            project + "-" + taskHours
          ),
          {
            project: project,
            date: date,
            hours: taskHours,
            secret: taskSecret,
          }
        );
        console.log("Document written");
        setTaskDate("");
        setTaskHours(0);
        setTaskProject("");
        setTaskSecret("");
      } catch (e) {
        console.error("Error adding document: ", e);
      }
    } else {
      alert("All field is required");
    }
  };

  const setHours = (value) => {
    /**
     * value @type Number
     */
    let hours = Math.ceil(value * 2) / 2;
    setInputHours(hours);
    setTaskHours(hours);
  };

  const setDates = (e) => {
    /**
     * format() return @type String
     */
    setTaskDate(e.format("D"));
    setCollectionDate(e.format("YYYY-M"));
  };

  const showDrawer = () => {
    setOpenDrawer(true);
  };
  const onClose = () => {
    setOpenDrawer(false);
  };

  return (
    <>
      <Button
        style={{ position: "absolute", top: "12px" }}
        onClick={showDrawer}
      >
        Add task
      </Button>
      <Drawer
        placement="top"
        height={180}
        closable={true}
        open={openDrawer}
        onClose={onClose}
      >
        <Row justify="center" align="middle" className="form">
          <Col span={3}>
            <Input
              placeholder="Project *"
              style={{ width: "95%" }}
              onChange={(e) => setTaskProject(e.target.value)}
            />
          </Col>
          <Col span={3}>
            <InputNumber
              placeholder="Hours *"
              style={{ width: "95%" }}
              min={0}
              max={200}
              step={0.5}
              precision={1}
              value={inputHours}
              onChange={setHours}
            />
          </Col>
          <Col span={3}>
            <DatePicker
              placeholder="Date *"
              format="DD-MM-YYYY"
              style={{ width: "95%" }}
              onChange={setDates}
            />
          </Col>
          <Col span={3}>
            <Input
              placeholder="Secret *"
              style={{ width: "95%" }}
              onChange={(e) => setTaskSecret(e.target.value)}
            />
          </Col>
          <Col span={3}>
            <Button style={{ width: "95%" }} onClick={addTask}>
              Submit
            </Button>
          </Col>
        </Row>
      </Drawer>
    </>
  );
}
export default Form;
