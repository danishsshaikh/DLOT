import React, { useEffect, useState } from "react";
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Document, Packer, Paragraph, HeadingLevel, TextRun } from "docx";
import CheckBox from "expo-checkbox";
import * as XLSX from "xlsx";

const DLOT = () => {
  const [timeText, setTime] = useState(null);
  const [agree, setAgree] = useState(false);
  const [studentName, setstudentName] = useState("");

  const [studentArray, setStudentArray] = useState([]);
  const [feedbackArray, setFeedbackArray] = useState(Array.from({ length: 6 }));

  const [currentStudent, setCurrentStudent] = useState(null);
  const [feedbacks, setFeedbacks] = useState({});

  const [logs, setLogs] = useState([]);

  const [opa, setOpa] = useState(100);
  const [editable, setEditable] = useState(true);
  const [bgColor, setbgColor] = useState("#2E3A8C");

  const [timeLeft, setTimeLeft] = useState(10);

  const handleChangeStudent = (index) => () => {
    setCurrentStudent(index);
  };

  const handleChangeFeedback = (index) => (text) => {
    setFeedbacks({});
    setFeedbackArray((a) => {
      const result = Array.from(a);

      result[index] = text;

      return result;
    });
  };

  const handleSelectFeedback = (index) => () => {
    const selectedFeedback = feedbackArray[index];
    //Mak
    if (selectedFeedback) {
      setFeedbacks((s) => {
        return {
          ...s,
          [selectedFeedback]: !s[selectedFeedback],
        };
      });
    }
  };

  const handleSubmitLog = () => {
    setTimeLeft(10);

    if (currentStudent === null || +currentStudent < 0) {
      // Validation
      return;
    }

    if (!studentArray[currentStudent]) {
      return;
    }

    console.log({
      1: feedbacks,
      2: Object.keys(feedbacks),
      3: Object.keys(feedbacks).filter((feedback) => {
        return !!feedbacks[feedback];
      }),
      4: Object.keys(feedbacks).map((feedback) => {
        return feedbacks[feedback];
      }),
    });

    const logDump = {
      name: studentArray[currentStudent],
      behaviors: Object.keys(feedbacks).filter((feedback) => {
        return !!feedbacks[feedback];
      }),
      time: new Date(),
    };

    setLogs((l) => [...l, logDump]);

    // After submission, resetting the states
    setFeedbacks({});
  };

  const handleEditing = () => {
    setOpa(0);
    setEditable(false);
  };

  const handleEditingOff = () => {
    setOpa(100);
    setEditable(true);
  };

  const addstudentName = () => {
    if (studentName == "") return;

    setStudentArray((sa) => {
      return [...sa, studentName];
    });

    setstudentName("");
  };

  const logInput = (input) => {
    setstudentName(input);
  };

  const GenerateWordDocument = () => {
    const paragraphs = [];
    logs.forEach((el) => {
      const behaviors = el.behaviors.reduce((previousValue, behavior) => {
        return previousValue + " " + behavior;
      }, "");

      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Name: ${el.name}`,
              bold: false,
            }),
          ],
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `Behavior: ${behaviors}`,
              bold: false,
            }),
          ],
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `Time: ${el.time}`,
              bold: false,
            }),
          ],
        })
      );
    });
    let doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              text: "DLOT Data",
              heading: HeadingLevel.TITLE,
            }),
            ...paragraphs,
          ],
        },
      ],
    });

    Packer.toBase64String(doc).then((base64) => {
      const filename = FileSystem.documentDirectory + "DLOT-Data.docx";
      FileSystem.writeAsStringAsync(filename, base64, {
        encoding: FileSystem.EncodingType.Base64,
      }).then(() => {
        console.log(`Saved file: ${filename}`);
        Sharing.shareAsync(filename);
        setLogs([]);
        setCurrentStudent(null);
        setFeedbacks([]);
      });
    });
  };

  const generateExcel = () => {
    const Dname = [];
    const Dbehaviour = [];
    const Dtime = [];

    logs.forEach((el) => {
      const behaviors = el.behaviors.reduce((previousValue, behavior) => {
        return previousValue + " " + behavior;
      }, "");

      Dname.push(el.name);
      Dbehaviour.push(behaviors);
      Dtime.push(el.time);
    });

    let wb = XLSX.utils.book_new();
    let ws = XLSX.utils.aoa_to_sheet([
      [...Dname, " ", " "],
      [...Dbehaviour, "", ""],
      [...Dtime, "", ""],
    ]);

    XLSX.utils.book_append_sheet(wb, ws, "DLOT Data", true);

    const base64 = XLSX.write(wb, { type: "base64" });
    const filename = FileSystem.documentDirectory + "DLOT.xlsx";
    FileSystem.writeAsStringAsync(filename, base64, {
      encoding: FileSystem.EncodingType.Base64,
    }).then(() => {
      Sharing.shareAsync(filename);
      setLogs([]);
      setCurrentStudent(null);
      setFeedbacks([]);
    });
  };

  useEffect(() => {
    setInterval(() => {
      let time = getCurrentTime();
      setTime(time);
    }, 1000);
  });

  useEffect(() => {
    if (timeLeft < 0) {
      setTimeLeft(0);
    }
  });

  useEffect(() => {
    setInterval(() => setbgColor("#2E3A8C"), 1000);
    setbgColor("#C35214");
  }, [timeLeft]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);
    return () => clearInterval(intervalId);
  }, []);

  const getCurrentTime = () => {
    let today = new Date();
    let hours = (today.getHours() < 10 ? "0" : "") + today.getHours();
    let minutes = (today.getMinutes() < 10 ? "0" : "") + today.getMinutes();
    let seconds = (today.getSeconds() < 10 ? "0" : "") + today.getSeconds();
    return hours + ":" + minutes + ":" + seconds;
  };

  const changeBoxvalue = () => {
    setAgree(!agree);
  };

  return (
    <View style={styles.container}>
      <View style={{ ...styles.smallWrapper, backgroundColor: bgColor }}>
        <Text style={styles.timeText}>{timeLeft}</Text>
      </View>
      <View style={styles.bigWrapper}>
        <View style={{ ...styles.inputWrapper, opacity: opa }}>
          <TextInput
            style={styles.inputText}
            placeholder="Name"
            onChangeText={logInput}
            value={studentName}
            editable={true}
          />

          <TouchableOpacity style={styles.inputAdd} onPress={addstudentName}>
            <Text style={styles.studentInputText}>Add</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={true}
          style={{
            height: 150,
            width: 350,
            paddingTop: 5,
            alignSelf: "center",
          }}
        >
          {studentArray.map((student, studentIndex) => (
            <TouchableOpacity
              style={
                currentStudent === studentIndex
                  ? styles.listItemSelected
                  : styles.listItem
              }
              key={`student-${studentIndex}`}
              onPress={handleChangeStudent(studentIndex)}
            >
              <Text
                style={
                  currentStudent === studentIndex
                    ? styles.listTextSelected
                    : styles.listText
                }
              >
                {student}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={styles.wrapper}>
          <View style={styles.checkboxgroupWrapper}>
            {feedbackArray.map((feedback, feedbackIndex) => {
              return (
                <View
                  style={styles.checkboxfirstcolumnWrapper}
                  key={`feedback_${feedbackIndex}`}
                >
                  <CheckBox
                    value={!!feedbacks[feedback]}
                    onValueChange={handleSelectFeedback(feedbackIndex)}
                    color={agree ? "#E66138" : "#E66138"}
                  />
                  <TextInput
                    style={styles.checkboxInput}
                    textContentType="behaviour1"
                    placeholder="  _______"
                    placeholderTextColor="#fff"
                    value={feedback}
                    onChangeText={handleChangeFeedback(feedbackIndex)}
                    editable={editable}
                  />
                </View>
              );
            })}
          </View>
          <View style={styles.newButtonsView}>
            <TouchableOpacity style={styles.logButton} onPress={handleEditing}>
              <Image
                source={require("./assets/begin.png")}
                resizeMode="contain"
                style={{}}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.logButton}
              onPress={handleEditingOff}
            >
              <Image
                source={require("./assets/edit.png")}
                resizeMode="contain"
                style={{}}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.logsbutton}>
            <TouchableOpacity
              style={styles.logButton}
              onPress={handleSubmitLog}
            >
              <Image
                source={require("./assets/log.png")}
                resizeMode="contain"
                style={{}}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.endWordButton}
              onPress={GenerateWordDocument}
            >
              <Image
                source={require("./assets/wordbutton.png")}
                resizeMode="contain"
                style={{}}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.endExcelButton}
              onPress={generateExcel}
            >
              <Image
                source={require("./assets/excelbutton.png")}
                resizeMode="contain"
                style={{}}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <View style={styles.imageWrapper}>
        <Image
          source={require("./assets/logo.png")}
          resizeMode="contain"
          style={styles.behaviorsyLogo}
        />
        <Image
          source={require("./assets/et.png")}
          resizeMode="contain"
          style={styles.etLogo}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    height: Dimensions.height,
    width: Dimensions.width,
  },

  smallWrapper: {
    height: 60,
    width: 240,
    marginTop: 60,
    marginLeft: 110,
    backgroundColor: "#2E3A8C",
    borderTopLeftRadius: 13,
    borderTopRightRadius: 13,
    alignItems: "center",
    alignContent: "center",
  },

  wrapper: {
    alignItems: "center",
    marginTop: 20,
  },

  checkboxgroupWrapper: {
    flexDirection: "column",
  },

  checkboxfirstcolumnWrapper: {
    flexDirection: "row",
    marginTop: 5,
  },

  text: {
    lineHeight: 30,
    marginLeft: 10,
    color: "white",
    fontSize: 20,
  },

  timeText: {
    marginTop: 10,
    fontSize: 30,
    color: "white",
  },

  bigWrapper: {
    height: 550,
    width: 350,
    paddingHorizontal: 25,
    backgroundColor: "#2E3A8C",
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    alignItems: "center",
  },

  inputWrapper: {
    marginTop: 20,
    paddingHorizontal: 10,
    flexDirection: "row",
  },

  inputText: {
    width: 200,
    height: 40,
    backgroundColor: "white",
    textAlign: "center",
  },

  inputAdd: {
    backgroundColor: "#E66138",
    width: 60,
    height: 40,
    borderTopEndRadius: 20,
    borderBottomEndRadius: 20,
  },

  studentInputText: {
    textAlign: "center",
    marginBottom: 5,
    marginTop: 10,
    marginBottom: 5,
    color: "white",
  },

  listItem: {
    width: 150,
    height: 40,
    backgroundColor: "#E66138",
    color: "#fff",
    borderRadius: 20,
    marginTop: 2,
    alignSelf: "center",
  },

  listItemSelected: {
    width: 180,
    height: 40,
    backgroundColor: "#f4f4f4",
    textColor: "#1f1f1f",
    color: "#1f1f1f",
    borderRadius: 20,
    marginTop: 2,
    alignSelf: "center",
  },

  listText: {
    fontWeight: "500",
    textAlign: "center",
    marginTop: 10,
    color: "#fff",
  },

  listTextSelected: {
    fontWeight: "500",
    textAlign: "center",
    marginTop: 10,
    color: "#1f1f1f",
  },

  checkboxInput: {
    textAlign: "center",
    color: "white",
    fontSize: 15,
    marginTop: 3,
  },

  newButtonsView: {
    flexDirection: "row",
  },

  logsbutton: {
    flexDirection: "row",
    marginTop: 20,
  },

  logButton: {
    marginTop: 5,
    marginLeft: 10,
  },
  endExcelButton: {
    marginBottom: 10,
    marginLeft: 10,
  },

  endWordButton: {
    marginBottom: 10,
    marginLeft: 10,
  },

  imageWrapper: {
    alignItems: "center",
    flexDirection: "row",
    marginTop: 1,
    padding: 10,
  },

  behaviorsyLogo: {
    paddingLeft: 30,
    marginBottom: 30,
  },
  etLogo: {
    paddingLeft: 20,
    marginBottom: 30,
  },
});

export default DLOT;
