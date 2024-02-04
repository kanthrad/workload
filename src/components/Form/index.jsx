import "./css/style.css";

import { useState, useEffect } from "react";

import { doc, setDoc } from "firebase/firestore";
import { db } from "../../firebase";

import { Row, Col, Input, InputNumber, DatePicker, Button, Drawer } from "antd";
import dayjs from "dayjs";

function Form() {
  const [collectionDate, setCollectionDate] = useState("");
  const [taskDate, setTaskDate] = useState("");
  const [inputDate, setInputDate] = useState("");
  const [taskHours, setTaskHours] = useState(0);
  const [taskProject, setTaskProject] = useState("");
  const [taskSecret, setTaskSecret] = useState("");
  const [openDrawer, setOpenDrawer] = useState(false);
  const [taskUserid, setTaskUserid] = useState("");

  /** handle the case when user has filled a form on another resource */
  useEffect(() => {
    if (window.location.search.length > 0) {
      /* get params from url */
      const params = new URLSearchParams(window.location.search);
      for (const [key, value] of params.entries()) {
        switch (key) {
          case "project":
            setTaskProject(value);
            break;
          case "date":
            setDates(dayjs(value));
            break;
          case "hour":
            setHours(Number(value));
            break;
          case "userid":
            setTaskUserid(value);
            break;
          default:
            break;
        }
      }
      setOpenDrawer(true);
    }
  }, []);

  const addTask = async (e) => {
    e.preventDefault();
    if (taskDate && taskHours && taskProject && taskSecret && taskUserid) {
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
            "tasks-" + taskUserid + "-" + collectionDate,
            project + "-" + taskHours
          ),
          {
            project: project,
            date: date,
            hours: taskHours,
            secret: taskSecret,
            userid: taskUserid,
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
    setTaskHours(hours);
  };

  const setDates = (e) => {
    /**
     * format() return @type String
     */
    setInputDate(e);
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
          <Col span={4}>
            <Input
              addonBefore="Project"
              placeholder="Project *"
              style={{ width: "95%" }}
              value={taskProject}
              onChange={(e) => setTaskProject(e.target.value)}
            />
          </Col>
          <Col span={4}>
            <InputNumber
              addonBefore="Hours"
              placeholder="Hours *"
              style={{ width: "95%" }}
              min={0}
              max={200}
              step={0.5}
              precision={1}
              value={taskHours}
              onChange={setHours}
            />
          </Col>
          <Col span={4}>
            <DatePicker
              placeholder="Date *"
              format="DD-MM-YYYY"
              style={{ width: "95%" }}
              value={inputDate}
              onChange={setDates}
            />
          </Col>
          <Col span={4}>
            <Input
              addonBefore="User"
              placeholder="User id *"
              style={{ width: "95%" }}
              value={taskUserid}
              onChange={(e) => setTaskUserid(e.target.value)}
            />
          </Col>
          <Col span={4}>
            <Input.Password
              placeholder="Secret *"
              style={{ width: "95%" }}
              value={taskSecret}
              onChange={(e) => setTaskSecret(e.target.value)}
              visibilityToggle={{ visible: false }}
            />
          </Col>
          <Col span={4}>
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
