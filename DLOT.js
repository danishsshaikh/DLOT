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
import {
  responsiveHeight,
  responsiveWidth,
  responsiveFontSize,
} from "react-native-responsive-dimensions";

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

  const onLongPressTest = (item) => () => {
    //console.log(index);
    //console.log(item);
    let deleteIndex = studentArray.indexOf(item);
    studentArray.splice(deleteIndex, 1);
    //console.log("" + deleteIndex + studentArray);
    //console.log(studentArray);
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

  function handleDelete() {
    setLogs([]);
    setCurrentStudent(null);
    setFeedbacks([]);
    setStudentArray([]);
    setFeedbackArray(Array.from({ length: 6 }));
    //console.log(logs);
  }

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
              onLongPress={onLongPressTest(student)}
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
            <TouchableOpacity
              style={{
                backgroundColor: "#E66138",
                borderRadius: responsiveWidth(5),
                padding: responsiveWidth(3),
                alignItems: "center",
                justifyContent: "center",
              }}
              onPress={handleDelete}
            >
              <Text style={{ color: "white" }}>Delete</Text>
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
    height: responsiveHeight(7),
    width: responsiveWidth(61),
    marginTop: responsiveHeight(7),
    marginLeft: responsiveWidth(28),
    backgroundColor: "#2E3A8C",
    borderTopLeftRadius: responsiveWidth(5),
    borderTopRightRadius: responsiveWidth(5),
    alignItems: "center",
    alignContent: "center",
  },

  wrapper: {
    alignItems: "center",
    marginTop: responsiveHeight(5),
  },

  checkboxgroupWrapper: {
    flexDirection: "column",
  },

  checkboxfirstcolumnWrapper: {
    flexDirection: "row",
    marginTop: responsiveHeight(1),
  },

  text: {
    lineHeight: 30,
    color: "white",
  },

  timeText: {
    marginTop: responsiveHeight(1),
    fontSize: responsiveFontSize(4),
    color: "white",
  },

  bigWrapper: {
    height: responsiveHeight(70),
    width: responsiveWidth(89),
    backgroundColor: "#2E3A8C",
    borderTopLeftRadius: responsiveWidth(5),
    borderBottomLeftRadius: responsiveWidth(5),
    borderBottomRightRadius: responsiveWidth(5),
    alignItems: "center",
  },

  inputWrapper: {
    marginTop: responsiveHeight(2),
    paddingHorizontal: responsiveHeight(2),
    flexDirection: "row",
  },

  inputText: {
    width: responsiveWidth(60),
    height: responsiveHeight(5),
    backgroundColor: "white",
    textAlign: "center",
  },

  inputAdd: {
    backgroundColor: "#E66138",
    width: responsiveWidth(20),
    height: responsiveHeight(5),
    borderTopEndRadius: responsiveWidth(5),
    borderBottomEndRadius: responsiveWidth(5),
  },

  studentInputText: {
    textAlign: "center",
    marginBottom: 5,
    marginTop: 10,
    marginBottom: 5,
    color: "white",
  },

  listItem: {
    width: responsiveWidth(40),
    height: responsiveHeight(5),
    backgroundColor: "#E66138",
    color: "#fff",
    borderRadius: responsiveWidth(5),
    marginTop: 2,
    alignSelf: "center",
  },

  listItemSelected: {
    width: responsiveWidth(45),
    height: responsiveHeight(6),
    backgroundColor: "#f4f4f4",
    textColor: "#1f1f1f",
    color: "#1f1f1f",
    borderRadius: responsiveWidth(5),
    marginTop: 2,
    alignSelf: "center",
  },

  listText: {
    fontWeight: "500",
    textAlign: "center",
    marginTop: responsiveHeight(1),
    color: "#fff",
  },

  listTextSelected: {
    fontWeight: "500",
    textAlign: "center",
    marginTop: responsiveHeight(1),
    color: "#1f1f1f",
  },

  checkboxInput: {
    textAlign: "center",
    color: "white",
    fontSize: responsiveFontSize(1.8),
    marginTop: 3,
  },

  newButtonsView: {
    flexDirection: "row",
  },

  logsbutton: {
    flexDirection: "row",
    marginTop: responsiveHeight(2),
  },

  logButton: {
    marginTop: responsiveHeight(0.5),
    marginLeft: responsiveWidth(1),
  },
  endExcelButton: {
    marginBottom: 10,
    marginLeft: responsiveWidth(1),
  },

  endWordButton: {
    marginBottom: 10,
    marginLeft: responsiveWidth(1),
  },

  imageWrapper: {
    alignItems: "center",
    flexDirection: "row",
    marginTop: 1,
    padding: responsiveHeight(1),
  },

  behaviorsyLogo: {
    paddingLeft: responsiveWidth(3),
    marginBottom: responsiveHeight(3),
  },
  etLogo: {
    paddingLeft: responsiveWidth(2),
    marginBottom: responsiveHeight(3),
  },
});

export default DLOT;
